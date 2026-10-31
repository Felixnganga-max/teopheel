import { useState } from 'react';
import { Smartphone, Banknote, FileText, RefreshCw, Copy, CheckCircle2, AlertTriangle, Code2, CreditCard } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getPaymentCallbacks, useSetPaymentReceipt } from '../../api';
import { formatCurrency, formatTime, copyText, MPESA_STATUS, PAYMENT_FLAGS, PAYMENT_METHOD } from '../../lib/format';
import { inputCls } from '../../lib/ui';

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-50 last:border-0 text-sm">
      <span className="text-steel">{label}</span>
      <span className="font-medium text-gray-900 text-right break-all">{children}</span>
    </div>
  );
}

// One M-Pesa attempt: what we asked for, what Safaricom said, and (owner) the raw callback.
function Attempt({ p, onChanged }) {
  const { isOwner } = useAuth();
  const { showToast } = useToast();
  const setReceipt = useSetPaymentReceipt();
  const [code, setCode] = useState('');
  const [raw, setRaw] = useState(null);
  const st = MPESA_STATUS[p.status] || MPESA_STATUS.pending;

  const addCode = async () => {
    try {
      await setReceipt.mutate({ paymentId: p._id, mpesaReceipt: code.trim() });
      showToast({ type: 'success', message: 'M-Pesa code saved' });
      setCode('');
      onChanged?.();
    } catch (err) { showToast({ type: 'error', message: err.message }); }
  };

  const toggleRaw = async () => {
    if (raw) return setRaw(null);
    try { setRaw((await getPaymentCallbacks(p._id)).data); } catch (err) { showToast({ type: 'error', message: err.message }); }
  };

  return (
    <div className="rounded-xl border border-gray-100 p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={st.variant}>{st.label}</Badge>
        {p.initiatedBy === 'staff' && <Badge>Sent by staff</Badge>}
        {p.flags.map((f) => <Badge key={f} variant="danger">{PAYMENT_FLAGS[f]?.label || f}</Badge>)}
        <span className="text-xs text-steel-light ml-auto">{formatTime(p.createdAt)}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
        <div>
          <Row label="Asked for">{formatCurrency(p.amountRequested)}</Row>
          <Row label="Paid">{p.amountPaid != null ? formatCurrency(p.amountPaid) : '—'}</Row>
          <Row label="M-Pesa code">
            {p.mpesaReceipt ? (
              <button className="inline-flex items-center gap-1 font-mono cursor-pointer hover:text-accent" onClick={async () => showToast({ type: (await copyText(p.mpesaReceipt)) ? 'success' : 'error', message: 'Code copied' })}>
                {p.mpesaReceipt} <Copy className="w-3 h-3" />
              </button>
            ) : '—'}
          </Row>
        </div>
        <div>
          <Row label="Prompt sent to">{p.stkPhone || '—'}</Row>
          <Row label="M-Pesa time">{p.transactionDate ? formatTime(p.transactionDate) : '—'}</Row>
          <Row label="Safaricom says">{p.resultDesc || (p.status === 'pending' ? 'Waiting…' : '—')}</Row>
        </div>
      </div>

      {p.flags.map((f) => PAYMENT_FLAGS[f] && (
        <p key={f} className="text-xs text-danger flex gap-2 items-start"><AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {PAYMENT_FLAGS[f].help}</p>
      ))}

      {p.flags.includes('receipt_missing') && (
        <div className="flex flex-col sm:flex-row gap-2">
          <input className={`${inputCls} font-mono uppercase`} maxLength={10} value={code} onChange={(e) => setCode(e.target.value)} placeholder="M-Pesa code e.g. SKB1X2Y3Z4" />
          <Button size="sm" disabled={code.trim().length !== 10 || setReceipt.loading} onClick={addCode}>Save code</Button>
        </div>
      )}

      {isOwner && p.status !== 'pending' && (
        <div>
          <button onClick={toggleRaw} className="text-xs text-steel-light hover:text-accent inline-flex items-center gap-1 cursor-pointer"><Code2 className="w-3.5 h-3.5" /> {raw ? 'Hide' : 'View'} message from Safaricom</button>
          {raw && (
            raw.length ? raw.map((r) => (
              <div key={r._id} className="mt-2">
                <p className="text-xs text-steel-light">{formatTime(r.createdAt)} · {r.outcome}{r.ip ? ` · ${r.ip}` : ''}</p>
                <pre className="text-xs bg-shell text-green-200 rounded-lg p-3 overflow-x-auto max-h-64">{JSON.stringify(r.body, null, 2)}</pre>
              </div>
            )) : <p className="text-xs text-steel mt-2">No callback received. The result came from a status check.</p>
          )}
        </div>
      )}
    </div>
  );
}

// Everything about money for one order. Actions are passed in so the page owns the modals.
export default function PaymentPanel({ order, onStk, onCash, onCheck, onNewLink, onChanged, busy }) {
  const s = order.paymentSummary;
  const paid = s.status === 'paid';
  const instantOpen = order.paymentMode === 'instant' && !paid && order.status !== 'cancelled';

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2"><CreditCard className="w-4 h-4 text-accent" /> Payment</h3>
        <span className="text-xl font-bold text-accent">{formatCurrency(s.amountDue)}</span>
      </div>

      {paid ? (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 space-y-1">
          <p className="flex items-center gap-2 font-semibold text-success"><CheckCircle2 className="w-5 h-5" /> Paid by {PAYMENT_METHOD[s.method] || 'unknown method'}</p>
          <div className="text-sm text-gray-700 space-y-0.5">
            <p>Amount received: <strong>{formatCurrency(s.amountPaid)}</strong></p>
            {s.mpesaReceipt && <p>{s.method === 'mpesa' ? 'M-Pesa code' : 'Reference'}: <strong className="font-mono">{s.mpesaReceipt}</strong></p>}
            <p>When: {formatTime(s.paidAt)}</p>
            {s.cash && <p>Cash handed over by {s.cash.handedBy || 'unknown'}, recorded by {s.cash.recordedBy || '—'}{s.cash.note ? ` (${s.cash.note})` : ''}</p>}
            {s.invoice && <p>Invoice {s.invoice.invoiceNumber} settled</p>}
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-4 text-sm text-gray-700">
          {order.paymentMode === 'invoice'
            ? <p className="flex items-center gap-2"><FileText className="w-4 h-4 text-warning" /> Billed on invoice {s.invoice?.invoiceNumber || ''}. It is marked paid from Invoices.</p>
            : s.status === 'pending' ? <p>Waiting for the customer to enter their M-Pesa PIN.</p>
            : order.status === 'cancelled' ? <p>Order cancelled. Nothing to collect.</p>
            : <p>Not paid yet.</p>}
        </div>
      )}

      {instantOpen && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={busy} onClick={onStk}><Smartphone className="w-3.5 h-3.5" /> Send M-Pesa prompt</Button>
          {s.status === 'pending' && <Button size="sm" variant="outline" disabled={busy} onClick={onCheck}><RefreshCw className="w-3.5 h-3.5" /> Check payment</Button>}
          <Button size="sm" variant="outline" disabled={busy} onClick={onCash}><Banknote className="w-3.5 h-3.5" /> Record cash</Button>
          {order.customerPhone && <Button size="sm" variant="outline" disabled={busy} onClick={onNewLink}><CreditCard className="w-3.5 h-3.5" /> New pay link</Button>}
        </div>
      )}

      {order.payments.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wider text-steel-light">M-Pesa attempts ({order.payments.length})</p>
          {[...order.payments].reverse().map((p) => <Attempt key={p._id} p={p} onChanged={onChanged} />)}
        </div>
      )}
    </section>
  );
}
