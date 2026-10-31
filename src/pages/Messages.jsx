// frontend/src/pages/Messages.jsx  (SMS log: did the customer get the text?)
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, RotateCw, CheckCheck, RefreshCw, Send, Wallet, AlertCircle } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Field from '../components/ui/Field';
import Pager from '../components/ui/Pager';
import StatCard from '../components/ui/StatCard';
import { Spinner, ErrorBox, EmptyState } from '../components/ui/Feedback';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useMessages, useSmsBalance, useRetryMessage, useSyncMessage, useRetryFailedMessages, useSendTestSms } from '../api';
import { formatTime, MESSAGE_STATUS, MESSAGE_TYPE } from '../lib/format';
import { inputCls } from '../lib/ui';

const FILTERS = [['all', 'All'], ['failed', 'Failed'], ['sent', 'Sent'], ['delivered', 'Delivered']];
const LIMIT = 20;

export default function Messages() {
  const { isOwner } = useAuth();
  const { showToast } = useToast();
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(null);
  const [testOpen, setTestOpen] = useState(false);
  const [testPhone, setTestPhone] = useState('');

  const { data: rows, meta, loading, error, refetch } = useMessages({ status: filter === 'all' ? undefined : filter, page, limit: LIMIT }, { pollMs: 15000 });
  const balance = useSmsBalance({ enabled: isOwner });
  const retry = useRetryMessage();
  const sync = useSyncMessage();
  const retryAll = useRetryFailedMessages();
  const test = useSendTestSms();

  const act = async (id, fn, ok) => {
    setBusy(id);
    try { const res = await fn(); showToast({ type: 'success', message: typeof ok === 'function' ? ok(res) : ok }); await refetch(); }
    catch (err) { showToast({ type: 'error', message: err.message }); }
    finally { setBusy(null); }
  };

  const sendTest = async () => {
    try {
      await test.mutate({ phone: testPhone.trim() });
      showToast({ type: 'success', message: 'Test SMS sent. SMS is working.' });
      setTestOpen(false);
      setTestPhone('');
      refetch();
    } catch (err) { showToast({ type: 'error', message: err.message, persistent: true }); }
  };

  const credit = balance.data?.credit;
  const failed = meta?.failedCount ?? 0;

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={AlertCircle} title="Failed messages" value={failed} />
        {isOwner && (
          <StatCard
            icon={Wallet}
            title="Celcom credit"
            value={balance.loading ? '…' : balance.data?.configured === false ? 'Not set up' : credit ?? 'Unknown'}
          />
        )}
      </div>

      {isOwner && balance.data?.configured === false && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-gray-700">
          SMS is not set up yet. Add <code>CELCOM_API_KEY</code>, <code>CELCOM_PARTNER_ID</code> and <code>CELCOM_SHORTCODE</code> to the backend settings, then use “Retry all failed”.
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex flex-wrap bg-white rounded-lg p-1 border border-gray-100">
          {FILTERS.map(([id, label]) => (
            <button key={id} onClick={() => { setFilter(id); setPage(1); }}
              className={`px-3 sm:px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${filter === id ? 'bg-accent text-shell shadow-sm' : 'text-steel hover:text-gray-700'}`}>
              {label}{id === 'failed' && failed > 0 ? ` (${failed})` : ''}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        {isOwner && failed > 0 && (
          <Button size="sm" variant="outline" disabled={busy === 'all'} onClick={() => act('all', () => retryAll.mutate(50), (r) => `${r.data.sent} sent, ${r.data.failed} still failing`)}>
            <RotateCw className="w-3.5 h-3.5" /> Retry all failed
          </Button>
        )}
        {isOwner && <Button size="sm" variant="outline" onClick={() => setTestOpen(true)}><Send className="w-3.5 h-3.5" /> Send test SMS</Button>}
        <Button size="sm" variant="ghost" onClick={refetch}><RefreshCw className="w-4 h-4" /> Refresh</Button>
      </div>

      {loading && !rows && <Spinner />}
      <ErrorBox error={error} onRetry={refetch} />
      {rows?.length === 0 && <EmptyState icon={MessageSquare} message="No messages here" />}

      <div className="space-y-3">
        {rows?.map((m) => {
          const st = MESSAGE_STATUS[m.status] || MESSAGE_STATUS.queued;
          return (
            <div key={m._id} className={`bg-white rounded-2xl border shadow-sm p-5 space-y-2 ${m.status === 'failed' ? 'border-l-4 border-l-danger border-gray-200' : 'border-gray-100'}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-gray-900 text-sm">{MESSAGE_TYPE[m.type] || 'SMS'}</span>
                <Badge variant={st.variant}>{st.label}</Badge>
                {m.orderNumber && <Link to={`/orders/${m.order}`} className="text-xs text-accent hover:underline">{m.orderNumber}</Link>}
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

      <Pager page={page} limit={LIMIT} total={meta?.total} onChange={setPage} />

      <Modal isOpen={testOpen} onClose={() => setTestOpen(false)} title="Send a test SMS" size="sm">
        <div className="space-y-4">
          <Field label="Your phone number" hint="Sends one text through Celcom to confirm your keys, sender ID and credit work.">
            <input type="tel" className={inputCls} value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="07XX XXX XXX" />
          </Field>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setTestOpen(false)}>Cancel</Button>
            <Button className="flex-1" disabled={test.loading || testPhone.trim().length < 10} onClick={sendTest}><Send className="w-4 h-4" /> Send</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
