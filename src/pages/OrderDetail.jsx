// frontend/src/pages/OrderDetail.jsx
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Truck, XCircle, Repeat, Package, AlertTriangle, MapPin, User, History } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Field from '../components/ui/Field';
import RecordCashModal from '../components/cash/RecordCashModal';
import SendStkModal from '../components/payments/SendStkModal';
import PaymentPanel from '../components/orders/PaymentPanel';
import MessagesPanel from '../components/orders/MessagesPanel';
import Timeline from '../components/orders/Timeline';
import { Spinner, ErrorBox } from '../components/ui/Feedback';
import { useToast } from '../context/ToastContext';
import { useOrder, useMarkDelivered, useCancelOrder, useQueryPayment, useResendSms } from '../api';
import { formatCurrency, formatTime, ORDER_STATUS_VARIANT, PAYMENT_STATUS, PAYMENT_METHOD, PAYMENT_FLAGS, MOVEMENT_LABEL, copyText } from '../lib/format';
import { inputCls } from '../lib/ui';

function Card({ icon: Icon, title, children }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">{Icon && <Icon className="w-4 h-4 text-accent" />} {title}</h3>
      {children}
    </section>
  );
}

const Item = ({ label, children }) => (
  <div>
    <p className="text-xs text-steel-light uppercase tracking-wider">{label}</p>
    <div className="text-sm font-medium text-gray-800 mt-0.5">{children}</div>
  </div>
);

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data: order, loading, error, refetch } = useOrder(id, { pollMs: 8000 });
  const deliver = useMarkDelivered();
  const cancel = useCancelOrder();
  const check = useQueryPayment();
  const resend = useResendSms();

  const [stkOpen, setStkOpen] = useState(false);
  const [cashOpen, setCashOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn, ok) => {
    setBusy(true);
    try {
      const res = await fn();
      if (ok) showToast({ type: 'success', message: typeof ok === 'function' ? ok(res) : ok });
      await refetch();
      return res;
    } catch (err) { showToast({ type: 'error', message: err.message }); }
    finally { setBusy(false); }
  };

  const newLink = async () => {
    const res = await run(() => resend.mutate(order._id));
    const link = res?.data?.payLink;
    if (link) {
      const ok = await copyText(link);
      showToast({ type: ok ? 'success' : 'info', message: ok ? 'Fresh payment link copied (customer was texted too)' : link, persistent: !ok });
    }
  };

  const doCancel = async () => {
    if (!reason.trim()) return showToast({ type: 'error', message: 'Give a reason' });
    await run(() => cancel.mutate({ id: order._id, reason: reason.trim() }), 'Order cancelled, stock restored');
    setCancelOpen(false);
    setReason('');
  };

  if (loading && !order) return <Spinner />;
  if (error && !order) return <div className="p-8"><ErrorBox error={error} onRetry={refetch} /></div>;
  if (!order) return null;

  const pay = PAYMENT_STATUS[order.paymentStatus] || PAYMENT_STATUS.unpaid;
  const active = order.status === 'dispatched';
  const flags = order.paymentSummary.needsAttention;
  const ex = order.exchange;

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/orders'))}><ArrowLeft className="w-4 h-4" /> Back</Button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={refetch}><RefreshCw className="w-4 h-4" /> Refresh</Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h2>
            <Badge variant={ORDER_STATUS_VARIANT[order.status]}>{order.status}</Badge>
            <Badge variant={pay.variant}>{order.paymentStatus === 'paid' ? `Paid (${PAYMENT_METHOD[order.paymentMethod] || '—'})` : pay.label}</Badge>
            {ex.isExchange && <Badge variant="accent"><Repeat className="w-3 h-3 mr-1" />Brand swap</Badge>}
            {order.orderType === 'full_purchase' && <Badge variant="accent">Whole cylinder</Badge>}
          </div>
          <p className="text-sm text-steel mt-1">Created {formatTime(order.createdAt)}{order.createdByName ? ` by ${order.createdByName}` : ''}</p>
        </div>
        <p className="text-3xl font-bold text-accent">{formatCurrency(order.amount)}</p>
      </div>

      {flags.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-1">
          <p className="font-semibold text-danger flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Needs your attention</p>
          {flags.map((f) => <p key={f} className="text-sm text-gray-700"><strong>{PAYMENT_FLAGS[f]?.label || f}:</strong> {PAYMENT_FLAGS[f]?.help}</p>)}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <PaymentPanel
            order={order}
            busy={busy}
            onStk={() => setStkOpen(true)}
            onCash={() => setCashOpen(true)}
            onCheck={() => run(() => check.mutate(order._id), 'Payment status refreshed')}
            onNewLink={newLink}
            onChanged={refetch}
          />
          <MessagesPanel order={order} onChanged={refetch} />
          <Card icon={History} title="Timeline"><Timeline events={order.timeline} /></Card>
        </div>

        <div className="space-y-6">
          <Card icon={User} title="Customer & delivery">
            <div className="space-y-4">
              <Item label="Customer">{order.customerName || '—'}</Item>
              <Item label="Phone">{order.customerPhone || 'No phone set'}</Item>
              <Item label="Delivery"><span className="inline-flex gap-1"><MapPin className="w-3.5 h-3.5 mt-0.5 text-steel-light flex-shrink-0" />{order.deliveryAddress || 'Not given'}</span></Item>
              <Item label="Branch">{order.location?.name || '—'}</Item>
              {order.rider?.name && <Item label="Rider">{order.rider.name}{order.rider.phone ? ` · ${order.rider.phone}` : ''}</Item>}
              {order.deliveredAt && <Item label="Delivered">{formatTime(order.deliveredAt)}</Item>}
            </div>
          </Card>

          <Card icon={Package} title="Cylinders">
            <div className="space-y-4">
              <Item label={order.orderType === 'refill' ? 'Delivered (full)' : 'Sold (new cylinder with gas)'}>
                {ex.given.name} × {ex.given.quantity}<span className="text-steel font-normal"> @ {formatCurrency(order.unitPrice)}</span>
              </Item>
              {order.orderType === 'refill' && (
                <Item label={ex.emptyCollected ? 'Empties collected' : 'Empties to collect'}>
                  {ex.returned.length ? ex.returned.map((r, i) => <p key={i}>{r.name} × {r.quantity}</p>) : <p>{ex.given.name} × {ex.given.quantity}</p>}
                  {ex.isExchange && <p className="text-xs text-accent font-normal mt-1">Different brand from the one delivered</p>}
                </Item>
              )}
            </div>
            {order.stockMovements.length > 0 && (
              <div className="mt-5 pt-4 border-t border-gray-50 space-y-2">
                <p className="text-xs uppercase tracking-wider text-steel-light">Stock effect</p>
                {order.stockMovements.map((m) => (
                  <div key={m._id} className="flex justify-between gap-3 text-xs text-steel">
                    <span>{MOVEMENT_LABEL[m.type] || m.type} · {m.product}</span>
                    <span className="font-mono whitespace-nowrap">{m.fullDelta ? `full ${m.fullDelta > 0 ? '+' : ''}${m.fullDelta}` : ''} {m.emptyDelta ? `empty ${m.emptyDelta > 0 ? '+' : ''}${m.emptyDelta}` : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {active && (
            <Card title="Order actions">
              <div className="flex flex-col gap-2">
                <Button disabled={busy} onClick={() => run(() => deliver.mutate(order._id), order.orderType === 'refill' ? 'Delivered, empties added to stock' : 'Marked delivered')}><Truck className="w-4 h-4" /> Mark delivered</Button>
                {order.paymentStatus !== 'paid' && <Button variant="ghost" disabled={busy} onClick={() => setCancelOpen(true)}><XCircle className="w-4 h-4" /> Cancel order</Button>}
              </div>
            </Card>
          )}
          <p className="text-center text-xs text-steel-light"><Link to="/orders" className="hover:text-accent">All orders</Link></p>
        </div>
      </div>

      <SendStkModal order={stkOpen ? order : null} onClose={() => setStkOpen(false)} onDone={refetch} />
      <RecordCashModal order={cashOpen ? order : null} onClose={() => setCashOpen(false)} onDone={refetch} />

      <Modal isOpen={cancelOpen} onClose={() => setCancelOpen(false)} title={`Cancel ${order.orderNumber}`} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-steel">The full cylinder goes back into stock.</p>
          <Field label="Reason" required><input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Customer changed their mind" /></Field>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setCancelOpen(false)}>Keep order</Button>
            <Button variant="danger" className="flex-1" onClick={doCancel}>Cancel order</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
