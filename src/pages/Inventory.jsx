// frontend/src/pages/Inventory.jsx  (phone first)
import { useState, useMemo } from 'react';
import { Package, Plus, SlidersHorizontal, History, Boxes, Recycle } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Field from '../components/ui/Field';
import Pager from '../components/ui/Pager';
import { Spinner, ErrorBox, EmptyState } from '../components/ui/Feedback';
import RefillCard from '../components/inventory/RefillCard';
import ReceiveSheet from '../components/inventory/ReceiveSheet';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useStock, useRefillStatus, useMovements, useAdjustStock, useLocations, useProducts } from '../api';
import { formatTime, MOVEMENT_LABEL, STOCK_COLOR } from '../lib/format';
import { inputCls } from '../lib/ui';

const TABS = [
  { id: 'full', label: 'Full', icon: Boxes },
  { id: 'empty', label: 'Empty & refill', icon: Recycle },
  { id: 'moves', label: 'History', icon: History },
];
const LIMIT = 25;
const BLANK = { locationId: '', productId: '', full: '', empty: '', note: '' };

function Tile({ label, value, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-3 py-3 sm:px-5 sm:py-4">
      <p className="flex items-center gap-1.5 text-xs sm:text-sm text-steel"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />{label}</p>
      <p className="mt-1 text-2xl sm:text-3xl font-bold tabular-nums text-gray-900">{value}</p>
    </div>
  );
}

const sig = (n) => (n > 0 ? `+${n}` : n);
const deltaCls = (n) => (n > 0 ? 'text-success' : n < 0 ? 'text-danger' : 'text-steel-light');

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

  const stockQ = useStock(locId); // rows carry full, empty and atRefill, so the three tiles and both tabs share it
  const refillQ = useRefillStatus(locId, { enabled: tab === 'empty' });
  const movesQ = useMovements({ locationId: locId, page, limit: LIMIT }, { enabled: tab === 'moves' });
  const adjust = useAdjustStock();

  const rows = stockQ.data;
  const totals = (rows || []).reduce((t, r) => ({ full: t.full + r.full, empty: t.empty + r.empty, atRefill: t.atRefill + (r.atRefill || 0) }), { full: 0, empty: 0, atRefill: 0 });

  // product × branch matrix
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
  const refresh = () => { stockQ.refetch(); if (tab === 'empty') refillQ.refetch(); };
  const closeModal = () => { setModal(null); setForm(BLANK); };

  const submitAdjust = async () => {
    try {
      await adjust.mutate({ locationId: form.locationId, productId: form.productId, full: Number(form.full) || 0, empty: Number(form.empty) || 0, note: form.note.trim() });
      showToast({ type: 'success', message: 'Adjustment saved' });
      closeModal();
      refresh();
    } catch (err) { showToast({ type: 'error', message: err.message }); }
  };
  const adjustOk = form.productId && form.locationId && form.note.trim() && (Number(form.full) !== 0 || Number(form.empty) !== 0);

  const cellView = (c, mode) => {
    const n = mode === 'full' ? c?.full ?? 0 : c?.empty ?? 0;
    return (
      <>
        <span className={`font-semibold tabular-nums ${mode === 'full' && n === 0 ? 'text-danger' : mode === 'full' && c?.low ? 'text-warning' : 'text-gray-900'}`}>{n}</span>
        {mode === 'full' && n === 0 && <Badge variant="danger" className="text-[10px]">Out</Badge>}
        {mode === 'full' && n > 0 && c?.low && <Badge variant="warning" className="text-[10px]">Low</Badge>}
        {mode === 'empty' && (c?.atRefill || 0) > 0 && <Badge variant="info" className="text-[10px]">{c.atRefill} at station</Badge>}
      </>
    );
  };

  const stockList = (mode) => {
    if (!matrix) return null;
    if (matrix.prods.length === 0) return <EmptyState icon={Package} message="No gas brands yet" />;
    return (
      <>
        {/* Phones: one card per brand */}
        <div className="md:hidden space-y-3">
          {matrix.prods.map((p) => {
            const per = matrix.locIds.map((lid) => ({ lid, c: matrix.cell(p._id, lid) }));
            const total = per.reduce((n, x) => n + (mode === 'full' ? x.c?.full ?? 0 : x.c?.empty ?? 0), 0);
            return (
              <div key={p._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center gap-3">
                  {p.image?.url ? <img src={p.image.url} alt="" className="w-11 h-11 rounded-xl object-contain bg-card" /> : <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center"><Package className="w-5 h-5 text-accent" /></div>}
                  <span className="flex-1 font-semibold text-gray-900">{p.name}</span>
                  <span className="text-3xl font-bold tabular-nums" style={{ color: mode === 'full' ? (total === 0 ? '#E53E3E' : STOCK_COLOR.full) : '#8A6D1F' }}>{total}</span>
                </div>
                {matrix.locIds.length > 1 && (
                  <ul className="mt-3 pt-3 border-t border-gray-50 space-y-2">
                    {per.map(({ lid, c }) => <li key={lid} className="flex items-center justify-between text-sm"><span className="text-steel">{locName(lid)}</span><span className="flex items-center gap-2">{cellView(c, mode)}</span></li>)}
                  </ul>
                )}
                {matrix.locIds.length === 1 && per[0].c && mode === 'full' && per[0].c.full === 0 && <div className="mt-2"><Badge variant="danger">Out of stock</Badge></div>}
                {matrix.locIds.length === 1 && per[0].c && mode === 'full' && per[0].c.full > 0 && per[0].c.low && <div className="mt-2"><Badge variant="warning">Running low</Badge></div>}
                {matrix.locIds.length === 1 && per[0].c && mode === 'empty' && per[0].c.atRefill > 0 && <div className="mt-2"><Badge variant="info">{per[0].c.atRefill} at station</Badge></div>}
              </div>
            );
          })}
        </div>

        {/* Larger screens: the matrix */}
        <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full">
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
                      total += mode === 'full' ? c?.full ?? 0 : c?.empty ?? 0;
                      return <td key={lid} className="px-4 py-4"><div className="flex items-center gap-2 text-sm">{cellView(c, mode)}</div></td>;
                    })}
                    {matrix.locIds.length > 1 && <td className="px-4 py-4"><span className="font-semibold text-sm text-accent tabular-nums">{total}</span></td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-5 pb-28 md:pb-8">
      {/* Branch chips (owner) */}
      {isOwner && locations?.length > 0 && (
        <div className="-mx-4 px-4 md:mx-0 md:px-0 flex gap-2 overflow-x-auto pb-1">
          {[{ _id: '', name: 'All branches' }, ...locations].map((l) => (
            <button key={l._id || 'all'} onClick={() => { setLocationId(l._id); setPage(1); }}
              className={`shrink-0 px-4 h-10 rounded-full text-sm font-semibold border transition cursor-pointer ${locationId === l._id ? 'bg-shell text-white border-shell' : 'bg-white text-steel border-gray-200 hover:border-gray-300'}`}>
              {l.name}
            </button>
          ))}
        </div>
      )}

      {/* The three states of a cylinder */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Tile label="Full" value={totals.full} color={STOCK_COLOR.full} />
        <Tile label="Empty" value={totals.empty} color={STOCK_COLOR.empty} />
        <Tile label="At station" value={totals.atRefill} color={STOCK_COLOR.atRefill} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="grid grid-cols-3 sm:flex bg-white rounded-xl p-1 border border-gray-100 sm:w-fit">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); setPage(1); }}
              className={`flex items-center justify-center gap-1.5 px-2 sm:px-4 h-10 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${tab === t.id ? 'bg-accent text-shell shadow-sm' : 'text-steel hover:text-gray-700'}`}>
              <t.icon className="w-4 h-4 hidden min-[380px]:block" /> {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <Button size="lg" className="flex-1 sm:flex-none" onClick={() => setModal('receive')}><Plus className="w-4 h-4" /> Receive stock</Button>
          {isOwner && <Button size="lg" variant="secondary" onClick={() => setModal('adjust')}><SlidersHorizontal className="w-4 h-4" /> <span className="hidden sm:inline">Adjust</span></Button>}
        </div>
      </div>

      {tab !== 'moves' && (
        <>
          {tab === 'empty' && (
            <div className="space-y-4">
              {refillQ.loading && !refillQ.data && <Spinner />}
              <ErrorBox error={refillQ.error} onRetry={refillQ.refetch} />
              {refillQ.data?.map((b) => (
                <RefillCard key={b.location} state={b} name={refillQ.data.length > 1 ? b.name : ''} locationId={b.location} onChanged={refresh} />
              ))}
            </div>
          )}
          {stockQ.loading && !rows && <Spinner />}
          <ErrorBox error={stockQ.error} onRetry={stockQ.refetch} />
          {stockList(tab)}
        </>
      )}

      {tab === 'moves' && (
        <>
          {movesQ.loading && !movesQ.data && <Spinner />}
          <ErrorBox error={movesQ.error} onRetry={movesQ.refetch} />
          {movesQ.data?.length === 0 && <EmptyState icon={History} message="No stock movements yet" />}
          {movesQ.data?.length > 0 && (
            <>
              <ul className="md:hidden space-y-2">
                {movesQ.data.map((m) => (
                  <li key={m._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-gray-900">{m.product?.name}</span>
                      <Badge>{MOVEMENT_LABEL[m.type] || m.type}</Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm">
                      {m.fullDelta !== 0 && <span className={`font-semibold tabular-nums ${deltaCls(m.fullDelta)}`}>{sig(m.fullDelta)} full</span>}
                      {m.emptyDelta !== 0 && <span className={`font-semibold tabular-nums ${deltaCls(m.emptyDelta)}`}>{sig(m.emptyDelta)} empty</span>}
                    </div>
                    <p className="mt-1.5 text-xs text-steel-light">{formatTime(m.createdAt)}{m.user?.name ? ` · ${m.user.name}` : ''}{m.note ? ` · ${m.note}` : ''}</p>
                  </li>
                ))}
              </ul>
              <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-card-dark/50 border-b border-gray-100">
                    <tr>{['When', 'Product', 'Type', 'Full', 'Empty', 'By', 'Note'].map((h) => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-steel-light uppercase tracking-wider">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {movesQ.data.map((m) => (
                      <tr key={m._id}>
                        <td className="px-4 py-3 text-steel whitespace-nowrap">{formatTime(m.createdAt)}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{m.product?.name}</td>
                        <td className="px-4 py-3"><Badge>{MOVEMENT_LABEL[m.type] || m.type}</Badge></td>
                        <td className={`px-4 py-3 font-medium ${deltaCls(m.fullDelta)}`}>{sig(m.fullDelta)}</td>
                        <td className={`px-4 py-3 font-medium ${deltaCls(m.emptyDelta)}`}>{sig(m.emptyDelta)}</td>
                        <td className="px-4 py-3 text-steel">{m.user?.name || '—'}</td>
                        <td className="px-4 py-3 text-steel-light">{m.note || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <Pager page={page} limit={LIMIT} total={movesQ.meta?.total} onChange={setPage} />
        </>
      )}

      <ReceiveSheet
        isOpen={modal === 'receive'} onClose={closeModal} products={activeProducts} locations={locations} isOwner={isOwner}
        defaultLocationId={locationId} onSaved={() => { closeModal(); refresh(); }}
      />

      {/* Owner manual correction */}
      <Modal
        isOpen={modal === 'adjust'} onClose={closeModal} title="Adjust stock (stock-take / damage)"
        footer={<div className="flex gap-3"><Button variant="secondary" size="lg" className="flex-1" onClick={closeModal}>Cancel</Button><Button size="lg" className="flex-1" disabled={!adjustOk || adjust.loading} onClick={submitAdjust}>Save adjustment</Button></div>}
      >
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
            <Field label="Full (+/−)" hint="e.g. -2 for damaged"><input type="number" inputMode="numeric" className={inputCls} value={form.full} onChange={(e) => set({ full: e.target.value })} /></Field>
            <Field label="Empty (+/−)"><input type="number" inputMode="numeric" className={inputCls} value={form.empty} onChange={(e) => set({ empty: e.target.value })} /></Field>
          </div>
          <Field label="Reason" required><input className={inputCls} value={form.note} onChange={(e) => set({ note: e.target.value })} placeholder="Recorded in the audit trail" /></Field>
        </div>
      </Modal>
    </div>
  );
}
