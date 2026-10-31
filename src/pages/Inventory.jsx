// frontend/src/pages/Inventory.jsx
import { useState, useMemo } from 'react';
import { Package, Plus, SlidersHorizontal, History, Boxes, Recycle } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Field from '../components/ui/Field';
import Pager from '../components/ui/Pager';
import { Spinner, ErrorBox, EmptyState } from '../components/ui/Feedback';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useStock, useEmpties, useMovements, useReceiveStock, useAdjustStock, useLocations, useProducts } from '../api';
import { formatTime, MOVEMENT_LABEL } from '../lib/format';
import { inputCls } from '../lib/ui';

const TABS = [
  { id: 'full', label: 'Full cylinders', icon: Boxes },
  { id: 'empty', label: 'Empty containers', icon: Recycle },
  { id: 'moves', label: 'History', icon: History },
];
const LIMIT = 25;
const BLANK = { locationId: '', productId: '', fullReceived: '', emptiesReturned: '', full: '', empty: '', note: '' };

export default function Inventory() {
  const { isOwner } = useAuth();
  const { showToast } = useToast();
  const [tab, setTab] = useState('full');
  const [locationId, setLocationId] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // 'receive' | 'adjust'
  const [form, setForm] = useState(BLANK);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const { data: locations } = useLocations({ enabled: isOwner });
  const { data: products } = useProducts();
  const locId = isOwner ? locationId || undefined : undefined;

  const stockQ = useStock(locId, { enabled: tab === 'full' });
  const emptyQ = useEmpties(locId, { enabled: tab === 'empty' });
  const movesQ = useMovements({ locationId: locId, page, limit: LIMIT }, { enabled: tab === 'moves' });
  const receive = useReceiveStock();
  const adjust = useAdjustStock();

  const q = tab === 'full' ? stockQ : emptyQ;
  const rows = q.data;

  // product × location matrix
  const matrix = useMemo(() => {
    if (!rows) return null;
    const locIds = [...new Set(rows.map((r) => String(r.location)))];
    const prods = [];
    rows.forEach((r) => { if (!prods.find((p) => p._id === r.product._id)) prods.push(r.product); });
    const cell = (pid, lid) => rows.find((r) => r.product._id === pid && String(r.location) === lid);
    return { locIds, prods, cell };
  }, [rows]);

  const locName = (id) => locations?.find((l) => l._id === id)?.name || (isOwner ? 'Branch' : 'Stock');
  const activeProducts = products?.filter((p) => p.active) || [];

  const close = () => { setModal(null); setForm(BLANK); };

  const submitReceive = async () => {
    const payload = {
      productId: form.productId,
      fullReceived: Number(form.fullReceived) || 0,
      emptiesReturned: Number(form.emptiesReturned) || 0,
      note: form.note.trim() || undefined,
    };
    if (isOwner) payload.locationId = form.locationId;
    try {
      await receive.mutate(payload);
      showToast({ type: 'success', message: 'Stock updated' });
      close();
      stockQ.refetch(); emptyQ.refetch();
    } catch (err) { showToast({ type: 'error', message: err.message }); }
  };

  const submitAdjust = async () => {
    try {
      await adjust.mutate({ locationId: form.locationId, productId: form.productId, full: Number(form.full) || 0, empty: Number(form.empty) || 0, note: form.note.trim() });
      showToast({ type: 'success', message: 'Adjustment saved' });
      close();
      stockQ.refetch(); emptyQ.refetch();
    } catch (err) { showToast({ type: 'error', message: err.message }); }
  };

  const receiveOk = form.productId && (!isOwner || form.locationId) && (Number(form.fullReceived) > 0 || Number(form.emptiesReturned) > 0);
  const adjustOk = form.productId && form.locationId && form.note.trim() && (Number(form.full) !== 0 || Number(form.empty) !== 0);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap bg-white rounded-lg p-1 border border-gray-100 w-fit">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); setPage(1); }}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${tab === t.id ? 'bg-accent text-shell shadow-sm' : 'text-steel hover:text-gray-700'}`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {isOwner && (
            <select className={`${inputCls} sm:w-56`} value={locationId} onChange={(e) => { setLocationId(e.target.value); setPage(1); }}>
              <option value="">All branches</option>
              {locations?.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
            </select>
          )}
          <Button onClick={() => setModal('receive')}><Plus className="w-4 h-4" /> Receive stock</Button>
          {isOwner && <Button variant="secondary" onClick={() => setModal('adjust')}><SlidersHorizontal className="w-4 h-4" /> Adjust</Button>}
        </div>
      </div>

      {tab !== 'moves' && (
        <>
          {q.loading && !rows && <Spinner />}
          <ErrorBox error={q.error} onRetry={q.refetch} />
          {tab === 'empty' && q.meta?.totalEmpty !== undefined && (
            <p className="text-sm text-steel"><strong className="text-gray-900">{q.meta.totalEmpty}</strong> empty containers waiting to go back to the distributor</p>
          )}
          {matrix && matrix.prods.length === 0 && <EmptyState icon={Package} message="No gas brands yet" />}
          {matrix && matrix.prods.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead className="bg-card-dark/50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-steel-light uppercase tracking-wider">Product</th>
                    {matrix.locIds.map((id) => <th key={id} className="text-left px-4 py-4 text-xs font-semibold text-steel-light uppercase tracking-wider">{locName(id)}</th>)}
                    {matrix.locIds.length > 1 && <th className="text-left px-4 py-4 text-xs font-semibold text-steel-light uppercase tracking-wider">Total</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {matrix.prods.map((p) => {
                    let total = 0;
                    return (
                      <tr key={p._id} className="hover:bg-card-dark/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {p.image?.url ? <img src={p.image.url} alt="" className="w-9 h-9 rounded-lg object-contain bg-card" /> : <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center"><Package className="w-4 h-4 text-accent" /></div>}
                            <span className="font-medium text-gray-900 text-sm">{p.name}</span>
                          </div>
                        </td>
                        {matrix.locIds.map((lid) => {
                          const c = matrix.cell(p._id, lid);
                          const n = tab === 'full' ? c?.full ?? 0 : c?.empty ?? 0;
                          total += n;
                          return (
                            <td key={lid} className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <span className={`font-medium text-sm ${tab === 'full' && n === 0 ? 'text-danger' : tab === 'full' && c?.low ? 'text-warning' : 'text-gray-900'}`}>{n}</span>
                                {tab === 'full' && n === 0 && <Badge variant="danger" className="text-[10px]">Out</Badge>}
                                {tab === 'full' && n > 0 && c?.low && <Badge variant="warning" className="text-[10px]">Low</Badge>}
                              </div>
                            </td>
                          );
                        })}
                        {matrix.locIds.length > 1 && <td className="px-4 py-4"><span className="font-semibold text-sm text-accent">{total}</span></td>}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'moves' && (
        <>
          {movesQ.loading && !movesQ.data && <Spinner />}
          <ErrorBox error={movesQ.error} onRetry={movesQ.refetch} />
          {movesQ.data?.length === 0 && <EmptyState icon={History} message="No stock movements yet" />}
          {movesQ.data?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-card-dark/50 border-b border-gray-100">
                  <tr>{['When', 'Product', 'Type', 'Full', 'Empty', 'By', 'Note'].map((h) => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-steel-light uppercase tracking-wider">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {movesQ.data.map((m) => (
                    <tr key={m._id}>
                      <td className="px-4 py-3 text-steel whitespace-nowrap">{formatTime(m.createdAt)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{m.product?.name}</td>
                      <td className="px-4 py-3"><Badge>{MOVEMENT_LABEL[m.type] || m.type}</Badge></td>
                      <td className={`px-4 py-3 font-medium ${m.fullDelta > 0 ? 'text-success' : m.fullDelta < 0 ? 'text-danger' : 'text-steel-light'}`}>{m.fullDelta > 0 ? `+${m.fullDelta}` : m.fullDelta}</td>
                      <td className={`px-4 py-3 font-medium ${m.emptyDelta > 0 ? 'text-success' : m.emptyDelta < 0 ? 'text-danger' : 'text-steel-light'}`}>{m.emptyDelta > 0 ? `+${m.emptyDelta}` : m.emptyDelta}</td>
                      <td className="px-4 py-3 text-steel">{m.user?.name || '—'}</td>
                      <td className="px-4 py-3 text-steel-light">{m.note || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pager page={page} limit={LIMIT} total={movesQ.meta?.total} onChange={setPage} />
        </>
      )}

      {/* Receive from distributor */}
      <Modal isOpen={modal === 'receive'} onClose={close} title="Receive stock from distributor">
        <div className="space-y-4">
          {isOwner && (
            <Field label="Branch" required>
              <select className={inputCls} value={form.locationId} onChange={(e) => set({ locationId: e.target.value })}>
                <option value="">Select branch…</option>
                {locations?.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
              </select>
            </Field>
          )}
          <Field label="Gas brand" required>
            <select className={inputCls} value={form.productId} onChange={(e) => set({ productId: e.target.value })}>
              <option value="">Select…</option>
              {activeProducts.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full cylinders received"><input type="number" min="0" className={inputCls} value={form.fullReceived} onChange={(e) => set({ fullReceived: e.target.value })} /></Field>
            <Field label="Empties handed back"><input type="number" min="0" className={inputCls} value={form.emptiesReturned} onChange={(e) => set({ emptiesReturned: e.target.value })} /></Field>
          </div>
          <Field label="Note (optional)"><input className={inputCls} value={form.note} onChange={(e) => set({ note: e.target.value })} placeholder="Delivery note / truck" /></Field>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={close}>Cancel</Button>
            <Button className="flex-1" disabled={!receiveOk || receive.loading} onClick={submitReceive}>Save</Button>
          </div>
        </div>
      </Modal>

      {/* Owner manual correction */}
      <Modal isOpen={modal === 'adjust'} onClose={close} title="Adjust stock (stock-take / damage)">
        <div className="space-y-4">
          <Field label="Branch" required>
            <select className={inputCls} value={form.locationId} onChange={(e) => set({ locationId: e.target.value })}>
              <option value="">Select branch…</option>
              {locations?.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
            </select>
          </Field>
          <Field label="Gas brand" required>
            <select className={inputCls} value={form.productId} onChange={(e) => set({ productId: e.target.value })}>
              <option value="">Select…</option>
              {activeProducts.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full (+/−)" hint="e.g. -2 for damaged"><input type="number" className={inputCls} value={form.full} onChange={(e) => set({ full: e.target.value })} /></Field>
            <Field label="Empty (+/−)"><input type="number" className={inputCls} value={form.empty} onChange={(e) => set({ empty: e.target.value })} /></Field>
          </div>
          <Field label="Reason" required><input className={inputCls} value={form.note} onChange={(e) => set({ note: e.target.value })} placeholder="Recorded in the audit trail" /></Field>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={close}>Cancel</Button>
            <Button className="flex-1" disabled={!adjustOk || adjust.loading} onClick={submitAdjust}>Save adjustment</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
