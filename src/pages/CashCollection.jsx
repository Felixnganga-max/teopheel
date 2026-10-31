// frontend/src/pages/CashCollection.jsx
import { useState, useMemo } from 'react';
import { Banknote, Ban } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Field from '../components/ui/Field';
import Pager from '../components/ui/Pager';
import StatCard from '../components/ui/StatCard';
import { Spinner, ErrorBox, EmptyState } from '../components/ui/Feedback';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCashCollections, useVoidCash } from '../api/cashApi';
import { useLocations } from '../api/locationsApi';
import { formatCurrency, formatTime } from '../lib/format';
import { inputCls } from '../lib/ui';

const LIMIT = 20;
const today = () => new Date().toISOString().slice(0, 10);
const startOf = (d) => new Date(`${d}T00:00:00`);
const endOf = (d) => new Date(`${d}T23:59:59.999`);

export default function CashCollection() {
  const { isOwner } = useAuth();
  const { showToast } = useToast();
  const [fromDate, setFromDate] = useState(today());
  const [toDate, setToDate] = useState(today());
  const [status, setStatus] = useState('recorded');
  const [locationId, setLocationId] = useState('');
  const [page, setPage] = useState(1);
  const [voidTarget, setVoidTarget] = useState(null);
  const [reason, setReason] = useState('');

  const from = useMemo(() => startOf(fromDate), [fromDate]);
  const to = useMemo(() => endOf(toDate), [toDate]);

  const { data: locations } = useLocations({ enabled: isOwner });
  const { data: rows, meta, loading, error, refetch } = useCashCollections({ status, from, to, page, limit: LIMIT, locationId: isOwner ? locationId || undefined : undefined });
  const byDay = meta?.byDay;
  const voidCash = useVoidCash();

  const handleVoid = async () => {
    try {
      await voidCash.mutate({ id: voidTarget._id, reason: reason.trim() });
      showToast({ type: 'success', message: `${voidTarget.orderNumber} cash entry voided. The order is unpaid again.` });
      setVoidTarget(null);
      setReason('');
      refetch();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end gap-3">
        <Field label="From"><input type="date" className={inputCls} value={fromDate} max={toDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} /></Field>
        <Field label="To"><input type="date" className={inputCls} value={toDate} min={fromDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} /></Field>
        <Field label="Show">
          <select className={inputCls} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="recorded">Recorded</option>
            <option value="voided">Voided</option>
          </select>
        </Field>
        {isOwner && (
          <Field label="Branch">
            <select className={inputCls} value={locationId} onChange={(e) => { setLocationId(e.target.value); setPage(1); }}>
              <option value="">All branches</option>
              {locations?.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
            </select>
          </Field>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title={status === 'recorded' ? 'Cash collected' : 'Voided cash'} value={formatCurrency(meta?.summary?.amount)} icon={Banknote} subtitle={`${meta?.summary?.count ?? 0} entries`} />
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-steel-light uppercase tracking-wider mb-2">By day</p>
          <div className="flex flex-wrap gap-2">
            {byDay?.length ? byDay.map((d) => <Badge key={d._id} variant="accent">{d._id}: {formatCurrency(d.amount)}</Badge>) : <span className="text-sm text-steel">Nothing in this range</span>}
          </div>
        </div>
      </div>

      {loading && !rows && <Spinner />}
      <ErrorBox error={error} onRetry={refetch} />
      {rows?.length === 0 && <EmptyState icon={Banknote} message="No cash entries in this range" />}

      {rows?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-card-dark/50 border-b border-gray-100">
              <tr>{['When', 'Order', 'Customer', 'Branch', 'Amount', 'Handed by', 'Recorded by', ''].map((h, i) => <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-steel-light uppercase tracking-wider">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {rows.map((r) => (
                <tr key={r._id} className="hover:bg-card-dark/30">
                  <td className="px-4 py-3 text-steel whitespace-nowrap">{formatTime(r.createdAt)}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{r.orderNumber}{r.note && <p className="text-xs text-steel-light font-normal">{r.note}</p>}</td>
                  <td className="px-4 py-3 text-gray-800">{r.order?.customerName || '—'}</td>
                  <td className="px-4 py-3 text-gray-800">{r.location?.name}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(r.amount)}</td>
                  <td className="px-4 py-3 text-steel">{r.handedBy || '—'}</td>
                  <td className="px-4 py-3 text-steel">{r.recordedBy?.name}</td>
                  <td className="px-4 py-3 text-right">
                    {r.status === 'voided' ? <Badge variant="danger">Voided</Badge> : isOwner && <Button size="sm" variant="ghost" onClick={() => setVoidTarget(r)}><Ban className="w-3.5 h-3.5" /> Void</Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pager page={page} limit={LIMIT} total={meta?.total} onChange={setPage} />

      <Modal isOpen={!!voidTarget} onClose={() => setVoidTarget(null)} title={`Void cash — ${voidTarget?.orderNumber || ''}`} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-steel">{formatCurrency(voidTarget?.amount)} was recorded by mistake? The order goes back to unpaid.</p>
          <Field label="Reason" required><input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setVoidTarget(null)}>Cancel</Button>
            <Button variant="danger" className="flex-1" disabled={!reason.trim() || voidCash.loading} onClick={handleVoid}>Void entry</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
