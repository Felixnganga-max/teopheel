import { useState } from 'react';
import { Package, Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Counter from '../ui/Counter';
import { useToast } from '../../context/ToastContext';
import { useReceiveStock } from '../../api';
import { inputCls } from '../../lib/ui';
import { STOCK_COLOR } from '../../lib/format';

// Receive cylinders: one list, every brand with a Full and an Empty counter. Fill what arrived, tap Save.
export default function ReceiveSheet({ isOpen, onClose, products, locations, isOwner, defaultLocationId, onSaved }) {
  const { showToast } = useToast();
  const receive = useReceiveStock();
  const [locationId, setLocationId] = useState(defaultLocationId || '');
  const [rows, setRows] = useState({}); // { [productId]: { full, empty } }
  const [note, setNote] = useState('');

  const setRow = (id, patch) => setRows((r) => ({ ...r, [id]: { full: 0, empty: 0, ...r[id], ...patch } }));
  const items = Object.entries(rows).map(([productId, v]) => ({ productId, fullReceived: v.full || 0, emptiesReceived: v.empty || 0 })).filter((i) => i.fullReceived > 0 || i.emptiesReceived > 0);
  const totalFull = items.reduce((n, i) => n + i.fullReceived, 0);
  const totalEmpty = items.reduce((n, i) => n + i.emptiesReceived, 0);
  const branch = isOwner ? locationId || defaultLocationId : true;
  const ok = items.length > 0 && !!branch;

  const close = () => { setRows({}); setNote(''); onClose(); };

  const save = async () => {
    try {
      await receive.mutate({ items, note: note.trim() || undefined, ...(isOwner && { locationId: locationId || defaultLocationId }) });
      showToast({ type: 'success', message: `Received ${totalFull} full and ${totalEmpty} empty cylinders` });
      setRows({}); setNote('');
      onSaved();
    } catch (err) { showToast({ type: 'error', message: err.message }); }
  };

  return (
    <Modal
      isOpen={isOpen} onClose={close} title="Receive stock"
      footer={
        <div className="space-y-3">
          <p className="text-sm text-center text-steel">
            {items.length ? <><strong className="text-gray-900 tabular-nums">{totalFull}</strong> full · <strong className="text-gray-900 tabular-nums">{totalEmpty}</strong> empty</> : 'Enter what arrived'}
          </p>
          <Button size="lg" className="w-full" disabled={!ok || receive.loading} onClick={save}>{receive.loading && <Loader2 className="w-4 h-4 animate-spin" />} Save</Button>
        </div>
      }
    >
      <div className="space-y-5">
        {isOwner && (
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Branch</span>
            <select className={`${inputCls} mt-1.5`} value={locationId || defaultLocationId || ''} onChange={(e) => setLocationId(e.target.value)}>
              <option value="">Select branch…</option>
              {locations?.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
            </select>
          </label>
        )}

        <div className="space-y-3">
          {products.map((p) => {
            const r = rows[p._id] || {};
            return (
              <div key={p._id} className="rounded-2xl border border-gray-100 p-3 sm:p-4">
                <div className="flex items-center gap-3 mb-3">
                  {p.image?.url ? <img src={p.image.url} alt="" className="w-10 h-10 object-contain rounded-lg bg-card" /> : <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center"><Package className="w-4 h-4 text-accent" /></div>}
                  <span className="font-semibold text-gray-900">{p.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-center mb-1 flex items-center justify-center gap-1.5 text-steel"><span className="w-2 h-2 rounded-full" style={{ background: STOCK_COLOR.full }} /> Full</p>
                    <Counter value={r.full} onChange={(v) => setRow(p._id, { full: v })} label="" tone="green" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-center mb-1 flex items-center justify-center gap-1.5 text-steel"><span className="w-2 h-2 rounded-full" style={{ background: STOCK_COLOR.empty }} /> Empty</p>
                    <Counter value={r.empty} onChange={(v) => setRow(p._id, { empty: v })} label="" />
                  </div>
                </div>
              </div>
            );
          })}
          {products.length === 0 && <p className="text-sm text-steel text-center py-6">Add a gas brand first.</p>}
        </div>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Note (optional)</span>
          <input className={`${inputCls} mt-1.5`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Delivery note, truck, who dropped it" />
        </label>
      </div>
    </Modal>
  );
}
