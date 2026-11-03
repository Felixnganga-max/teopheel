// frontend/src/pages/Orders.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardList, Phone, Send, RefreshCw, Filter, AlertCircle, MessageSquare, CreditCard, Truck, XCircle, FileText, MessageCircle, Banknote, Search, Repeat, Eye, Smartphone } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Field from '../components/ui/Field';
import Pager from '../components/ui/Pager';
import RecordCashModal from '../components/cash/RecordCashModal';
import SendStkModal from '../components/payments/SendStkModal';
import { Spinner, ErrorBox, EmptyState } from '../components/ui/Feedback';
import { useToast } from '../context/ToastContext';
import {
  useOrders, useAttachPhone, useResendSms, useMarkDelivered, useCancelOrder, useQueryPayment,
  getOrderInvoice, shareInvoice, openWhatsApp,
} from '../api';
import { formatCurrency, formatTime, formatTimeAgo, ORDER_STATUS_VARIANT, PAYMENT_STATUS, PAYMENT_METHOD, copyText } from '../lib/format';
import { inputCls } from '../lib/ui';

const FILTERS = ['all', 'dispatched', 'delivered', 'cancelled'];
const LIMIT = 20;

export default function Orders() {
  const { showToast } = useToast();
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [phoneInputs, setPhoneInputs] = useState({});
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [cashTarget, setCashTarget] = useState(null);
  const [stkTarget, setStkTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  const { data: orders, meta, loading, error, refetch } = useOrders({ status: filter === 'all' ? undefined : filter, q: q || undefined, page, limit: LIMIT });
  const attach = useAttachPhone();
  const resend = useResendSms();
  const deliver = useMarkDelivered();
  const cancel = useCancelOrder();
  const check = useQueryPayment();

  const run = async (id, fn, okMessage) => {
    setBusyId(id);
    try {
      const res = await fn();
      if (okMessage) showToast({ type: 'success', message: typeof okMessage === 'function' ? okMessage(res) : okMessage });
      await refetch();
      return res;
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    } finally {
      setBusyId(null);
    }
  };

  const handleSetPhone = async (order) => {
    const phone = (phoneInputs[order._id] || '').trim();
    if (phone.length < 10) return showToast({ type: 'error', message: 'Enter a valid phone number' });
    const res = await run(order._id, () => attach.mutate({ id: order._id, phone }), (r) =>
      r.data.order.sms?.status === 'failed' ? 'Phone saved, but the SMS failed. Use Resend SMS.' : `Phone saved — SMS sent to ${phone}`
    );
    if (res) setPhoneInputs((p) => ({ ...p, [order._id]: '' }));
  };

  const handleResend = (order) =>
    run(order._id, () => resend.mutate(order._id), (r) => (r.data.order.sms?.status === 'sent' ? 'SMS sent' : 'SMS failed again. Check Celcom balance / sender ID.'));

  const handleCopyLink = async (order) => {
    const res = await run(order._id, () => resend.mutate(order._id));
    const link = res?.data?.payLink;
    if (link) {
      const ok = await copyText(link);
      showToast({ type: ok ? 'success' : 'info', message: ok ? 'Fresh payment link copied' : link, persistent: !ok });
    }
  };

  const handleShareInvoice = (order) =>
    run(order._id, async () => {
      const inv = await getOrderInvoice(order._id);
      const shared = await shareInvoice(inv.data._id);
      openWhatsApp(shared.data.whatsappLink);
    });

  const handleCancel = async () => {
    const reason = cancelReason.trim();
    if (!reason) return showToast({ type: 'error', message: 'Give a reason' });
    await run(cancelTarget._id, () => cancel.mutate({ id: cancelTarget._id, reason }), 'Order cancelled, stock restored');
    setCancelTarget(null);
    setCancelReason('');
  };

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-steel" />
          <div className="flex flex-wrap bg-white rounded-lg p-1 border border-gray-100">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(1); }}
                className={`px-3 sm:px-4 py-1.5 rounded-md text-xs font-semibold capitalize transition-all cursor-pointer ${filter === f ? 'bg-accent text-shell shadow-sm' : 'text-steel hover:text-gray-700'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <form className="relative flex-1 sm:max-w-xs" onSubmit={(e) => { e.preventDefault(); setQ(search.trim()); setPage(1); }}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel-light" />
          <input className={`${inputCls} pl-10`} value={search} onChange={(e) => { setSearch(e.target.value); if (!e.target.value) { setQ(''); setPage(1); } }} placeholder="Order no. or M-Pesa code" />
        </form>
        <div className="flex-1" />
        <Button size="sm" variant="ghost" onClick={refetch} className="w-full sm:w-auto"><RefreshCw className="w-4 h-4" /> Refresh</Button>
      </div>

      {loading && !orders && <Spinner />}
      <ErrorBox error={error} onRetry={refetch} />
      {orders?.length === 0 && <EmptyState icon={ClipboardList} message="No orders found" />}

      <div className="space-y-4">
        {orders?.map((order) => {
          const pay = PAYMENT_STATUS[order.paymentStatus] || PAYMENT_STATUS.unpaid;
          const hasPhone = !!order.customerPhone;
          const active = order.status === 'dispatched';
          const needsPhone = active && !hasPhone && order.paymentMode === 'instant';
          const busy = busyId === order._id;
          const smsFailed = order.sms?.status === 'failed';
          const canCash = order.paymentMode === 'instant' && order.paymentStatus !== 'paid' && order.status !== 'cancelled';

          return (
            <div key={order._id} className={`bg-white rounded-2xl border shadow-sm p-6 hover:shadow-md transition-shadow animate-fade-in ${smsFailed ? 'border-l-4 border-l-danger border-gray-200' : 'border-gray-100'}`}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-gray-900"><Link to={`/orders/${order._id}`} className="hover:text-accent hover:underline">{order.orderNumber}</Link></h4>
                    <Badge variant={ORDER_STATUS_VARIANT[order.status]}>{order.status}</Badge>
                    <Badge variant={pay.variant}>{order.paymentStatus === 'paid' && order.paymentMethod ? `Paid (${PAYMENT_METHOD[order.paymentMethod]})` : pay.label}</Badge>
                    {order.orderType === 'full_purchase' && <Badge variant="accent">Whole cylinder</Badge>}
                    {order.isExchange && <Badge variant="accent"><Repeat className="w-3 h-3 mr-1" />Swap</Badge>}
                    {smsFailed && <Badge variant="danger"><AlertCircle className="w-3 h-3 mr-1" />SMS failed</Badge>}
                  </div>
                  <p className="text-sm text-steel mt-1">{formatTime(order.createdAt)}{order.deliveryAddress ? ` · ${order.deliveryAddress}` : ''}</p>
                </div>
                <p className="text-xl font-bold text-accent">{formatCurrency(order.amount)}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-5">
                <div>
                  <p className="text-xs text-steel-light uppercase tracking-wider">Customer</p>
                  <p className="font-medium text-gray-800 mt-0.5">{order.customerName || '—'}</p>
                  <p className="text-xs text-steel">{order.customerPhone || 'No phone set'}</p>
                </div>
                <div>
                  <p className="text-xs text-steel-light uppercase tracking-wider">Branch</p>
                  <p className="font-medium text-gray-800 mt-0.5">{order.location?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-steel-light uppercase tracking-wider">Product</p>
                  <p className="font-medium text-gray-800 mt-0.5">{order.productSnapshot?.name} × {order.quantity}</p>
                  {order.isExchange && <p className="text-xs text-steel">Empty back: {order.returns.map((r) => `${r.productSnapshot?.brand} × ${r.quantity}`).join(', ')}</p>}
                </div>
                <div>
                  <p className="text-xs text-steel-light uppercase tracking-wider">Dispatched</p>
                  <p className="font-medium text-gray-800 mt-0.5">{formatTimeAgo(order.createdAt)}</p>
                  {order.rider?.name && <p className="text-xs text-steel">Rider: {order.rider.name}</p>}
                </div>
              </div>

              {needsPhone && (
                <div className="bg-accent/5 rounded-xl p-4 mb-4 border border-accent/20">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-accent" />
                      <span className="text-sm font-medium text-gray-700">Add phone to text the customer and send the payment link</span>
                    </div>
                    <div className="flex flex-1 flex-col sm:flex-row gap-2">
                      <input
                        type="tel"
                        value={phoneInputs[order._id] || ''}
                        onChange={(e) => setPhoneInputs({ ...phoneInputs, [order._id]: e.target.value })}
                        placeholder="07XX XXX XXX"
                        className={`${inputCls} flex-1`}
                      />
                      <Button size="sm" disabled={busy} onClick={() => handleSetPhone(order)} className="w-full sm:w-auto"><Send className="w-4 h-4" /> Save & Send SMS</Button>
                    </div>
                  </div>
                </div>
              )}

              {(
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-50">
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/orders/${order._id}`)}><Eye className="w-3.5 h-3.5" /> Details</Button>
                  {canCash && (hasPhone || active) && (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => setStkTarget(order)}><Smartphone className="w-3.5 h-3.5" /> M-Pesa prompt</Button>
                  )}
                  {hasPhone && (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => handleResend(order)}>
                      <MessageSquare className="w-3.5 h-3.5" /> {order.sms?.status === 'sent' ? 'Resend SMS' : 'Send SMS'}
                    </Button>
                  )}
                  {hasPhone && order.paymentMode === 'instant' && order.paymentStatus !== 'paid' && active && (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => handleCopyLink(order)}><CreditCard className="w-3.5 h-3.5" /> New pay link</Button>
                  )}
                  {order.paymentStatus === 'pending' && (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => run(order._id, () => check.mutate(order._id), 'Payment status refreshed')}>
                      <RefreshCw className="w-3.5 h-3.5" /> Check payment
                    </Button>
                  )}
                  {canCash && (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => setCashTarget(order)}><Banknote className="w-3.5 h-3.5" /> Record cash</Button>
                  )}
                  {order.paymentMode === 'invoice' && (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => handleShareInvoice(order)}><MessageCircle className="w-3.5 h-3.5" /> Share invoice</Button>
                  )}
                  {active && (
                    <Button size="sm" disabled={busy} onClick={() => run(order._id, () => deliver.mutate(order._id), order.orderType === 'refill' ? 'Delivered, empty cylinder added to stock' : 'Marked delivered')}>
                      <Truck className="w-3.5 h-3.5" /> Mark delivered
                    </Button>
                  )}
                  {active && order.paymentStatus !== 'paid' && (
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => setCancelTarget(order)}><XCircle className="w-3.5 h-3.5" /> Cancel</Button>
                  )}
                  {order.mpesaReceipt && <span className="self-center text-xs text-steel-light ml-auto flex items-center gap-1"><FileText className="w-3 h-3" /> {order.mpesaReceipt}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Pager page={page} limit={LIMIT} total={meta?.total} onChange={setPage} />

      <RecordCashModal order={cashTarget} onClose={() => setCashTarget(null)} onDone={refetch} />
      <SendStkModal order={stkTarget} onClose={() => setStkTarget(null)} onDone={refetch} />

      <Modal isOpen={!!cancelTarget} onClose={() => setCancelTarget(null)} title={`Cancel ${cancelTarget?.orderNumber || ''}`} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-steel">The full cylinder goes back into stock.</p>
          <Field label="Reason" required>
            <input className={inputCls} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="e.g. Customer changed their mind" />
          </Field>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setCancelTarget(null)}>Keep order</Button>
            <Button variant="danger" className="flex-1" onClick={handleCancel}>Cancel order</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}