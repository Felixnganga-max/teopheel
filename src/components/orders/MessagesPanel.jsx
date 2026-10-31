import { useState } from 'react';
import { MessageSquare, RotateCw, Send, CheckCheck } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import { useRetryMessage, useSyncMessage, useResendPaymentSms } from '../../api';
import { formatTime, MESSAGE_STATUS, MESSAGE_TYPE } from '../../lib/format';

// The SMS log for one order, with retry / delivery check, and the payment thank-you resend.
export default function MessagesPanel({ order, onChanged }) {
  const { showToast } = useToast();
  const retry = useRetryMessage();
  const sync = useSyncMessage();
  const resendThanks = useResendPaymentSms();
  const [busy, setBusy] = useState(null);

  const act = async (id, fn, ok) => {
    setBusy(id);
    try { const res = await fn(); showToast({ type: 'success', message: typeof ok === 'function' ? ok(res) : ok }); onChanged?.(); }
    catch (err) { showToast({ type: 'error', message: err.message }); }
    finally { setBusy(null); }
  };

  const thanks = order.messages.filter((m) => m.type === 'payment_received');
  const thanksSent = thanks.some((m) => m.status !== 'failed');
  const paid = order.paymentSummary.status === 'paid';

  const sendThanks = () => {
    if (thanksSent && !window.confirm('The thank-you text was already sent. Send it again?')) return;
    act('thanks', () => resendThanks.mutate({ id: order._id, force: thanksSent }), (r) => (r.data.status === 'failed' ? `SMS failed: ${r.data.error}` : 'Thank-you SMS sent'));
  };

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-accent" /> Messages to the customer</h3>
        {paid && order.customerPhone && (
          <Button size="sm" variant="outline" disabled={busy === 'thanks'} onClick={sendThanks}><Send className="w-3.5 h-3.5" /> {thanks.length ? 'Resend thank-you' : 'Send thank-you'}</Button>
        )}
      </div>

      {order.messages.length === 0 && <p className="text-sm text-steel">No messages yet{order.customerPhone ? '' : ' — there is no phone number on this order'}.</p>}

      <div className="space-y-3">
        {order.messages.map((m) => {
          const st = MESSAGE_STATUS[m.status] || MESSAGE_STATUS.queued;
          return (
            <div key={m._id} className="rounded-xl border border-gray-100 p-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-800">{MESSAGE_TYPE[m.type] || 'SMS'}</span>
                <Badge variant={st.variant}>{st.label}</Badge>
                <span className="text-xs text-steel-light ml-auto">to {m.to} · {formatTime(m.sentAt || m.createdAt)}</span>
              </div>
              <p className="text-sm text-steel bg-card rounded-lg p-3 break-words">{m.body}</p>
              {m.error && <p className="text-xs text-danger">{m.error}</p>}
              <div className="flex gap-2">
                {m.status === 'failed' && (
                  <Button size="sm" variant="outline" disabled={busy === m._id} onClick={() => act(m._id, () => retry.mutate(m._id), (r) => (r.data.status === 'failed' ? `Still failing: ${r.data.error}` : 'SMS sent'))}><RotateCw className="w-3.5 h-3.5" /> Retry</Button>
                )}
                {m.status === 'sent' && m.providerMessageId && (
                  <Button size="sm" variant="ghost" disabled={busy === m._id} onClick={() => act(m._id, () => sync.mutate(m._id), (r) => `Celcom says: ${r.data.report?.description || r.data.report?.status || 'no report yet'}`)}><CheckCheck className="w-3.5 h-3.5" /> Check delivery</Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
