import { useState } from 'react';
import { Recycle, Truck, PackageCheck, Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import { useResetEmpties, useCompleteRefill } from '../../api';
import { formatTimeAgo, STOCK_COLOR } from '../../lib/format';

const brandLine = (p) => p?.name || `${p?.brand || ''} ${p?.sizeKg || ''}kg`;

// One branch's refill trip, in two taps. The counts come from the system, nobody types a number.
//   1. Reset empty cylinders  -> empties go to "at the refill station"
//   2. Refill                 -> the same cylinders come back as full stock
export default function RefillCard({ state, name, locationId, onChanged }) {
  const { showToast } = useToast();
  const reset = useResetEmpties();
  const complete = useCompleteRefill();
  const [confirm, setConfirm] = useState(null); // 'reset' | 'refill'

  const run = state.run;
  const busy = reset.loading || complete.loading;
  const lines = run ? run.items.map((i) => ({ name: brandLine(i.productSnapshot), quantity: i.quantity })) : state.byProduct.map((r) => ({ name: brandLine(r.product), quantity: r.quantity }));

  const doReset = async () => {
    try {
      const res = await reset.mutate(locationId);
      setConfirm(null);
      showToast({ type: 'success', message: `Reset. ${res.data.total} empty cylinders are at the refill station. Tap Refill when you're back.` });
      onChanged();
    } catch (err) { setConfirm(null); showToast({ type: 'error', message: err.message }); onChanged(); }
  };
  const doRefill = async () => {
    try {
      const res = await complete.mutate(locationId);
      setConfirm(null);
      showToast({ type: 'success', message: `Refilled. ${res.data.total} full cylinders added to stock.` });
      onChanged();
    } catch (err) { setConfirm(null); showToast({ type: 'error', message: err.message }); onChanged(); }
  };

  // ---------- A trip is out: waiting for Refill ----------
  if (run) {
    return (
      <section className="rounded-3xl overflow-hidden bg-shell text-white shadow-lg">
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-2 text-sm" style={{ color: '#9DBEEA' }}>
            <Truck className="w-4 h-4" /> {name ? `${name} · ` : ''}At the refill station
          </div>
          <p className="mt-3 text-6xl font-bold tabular-nums leading-none">{run.total}</p>
          <p className="mt-2 text-base text-white/80">empty cylinders sent for refilling</p>
          <p className="mt-1 text-xs text-white/50">Reset {formatTimeAgo(run.startedAt)}</p>

          <ul className="mt-5 grid grid-cols-1 gap-2">
            {lines.map((l) => (
              <li key={l.name} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm">
                <span className="text-white/90">{l.name}</span>
                <span className="font-semibold tabular-nums">{l.quantity}</span>
              </li>
            ))}
          </ul>

          {state.emptyNow > 0 && <p className="mt-4 text-xs text-white/60">{state.emptyNow} new {state.emptyNow === 1 ? 'empty' : 'empties'} came in since. {state.emptyNow === 1 ? 'It stays' : 'They stay'} on the shelf for the next trip.</p>}

          <p className="mt-5 text-sm text-white/80">Go and refill. When you are back with the full cylinders, tap Refill.</p>
          <button
            type="button" disabled={busy} onClick={() => setConfirm('refill')}
            className="mt-3 w-full h-14 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.99] transition"
            style={{ background: STOCK_COLOR.full }}
          >
            <PackageCheck className="w-5 h-5" /> Refill
          </button>
        </div>

        <Modal
          isOpen={confirm === 'refill'} onClose={() => setConfirm(null)} title="Add the refilled cylinders?" size="sm"
          footer={<div className="flex gap-3"><Button variant="secondary" className="flex-1" size="lg" onClick={() => setConfirm(null)}>Not yet</Button><Button className="flex-1" size="lg" disabled={busy} onClick={doRefill}>{complete.loading && <Loader2 className="w-4 h-4 animate-spin" />} Refill</Button></div>}
        >
          <p className="text-sm text-steel">These {run.total} cylinders will be added to your <strong className="text-gray-900">full stock</strong>:</p>
          <ul className="mt-3 divide-y divide-gray-100 rounded-xl border border-gray-100">
            {lines.map((l) => <li key={l.name} className="flex justify-between px-4 py-3 text-sm"><span>{l.name}</span><strong className="tabular-nums">{l.quantity}</strong></li>)}
          </ul>
        </Modal>
      </section>
    );
  }

  // ---------- No trip out ----------
  const ready = state.emptyNow > 0;
  return (
    <section className="rounded-3xl bg-white border border-gray-100 shadow-sm p-5 sm:p-6">
      <div className="flex items-center gap-2 text-sm text-steel"><Recycle className="w-4 h-4" style={{ color: STOCK_COLOR.empty }} /> {name ? `${name} · ` : ''}Empty cylinders on the shelf</div>
      <p className="mt-3 text-6xl font-bold tabular-nums leading-none text-gray-900">{state.emptyNow}</p>

      {ready ? (
        <>
          <ul className="mt-5 grid grid-cols-1 gap-2">
            {lines.map((l) => (
              <li key={l.name} className="flex items-center justify-between rounded-xl bg-card px-4 py-3 text-sm">
                <span className="text-gray-800">{l.name}</span>
                <span className="font-semibold tabular-nums text-gray-900">{l.quantity}</span>
              </li>
            ))}
          </ul>
          <button
            type="button" disabled={busy} onClick={() => setConfirm('reset')}
            className="mt-5 w-full h-14 rounded-2xl font-bold text-base text-shell bg-accent hover:bg-accent-hover flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.99] transition"
          >
            <Recycle className="w-5 h-5" /> Reset empty cylinders
          </button>
          <p className="mt-2 text-xs text-steel-light text-center">Tap when you take the empties to be refilled.</p>
        </>
      ) : (
        <p className="mt-3 text-sm text-steel">Nothing to send for refill right now. Empties appear here when customers hand them back.</p>
      )}

      {state.lastCompleted && <p className="mt-4 pt-4 border-t border-gray-100 text-xs text-steel-light">Last trip: {state.lastCompleted.total} cylinders refilled {formatTimeAgo(state.lastCompleted.completedAt)}</p>}

      <Modal
        isOpen={confirm === 'reset'} onClose={() => setConfirm(null)} title="Send empties for refilling?" size="sm"
        footer={<div className="flex gap-3"><Button variant="secondary" className="flex-1" size="lg" onClick={() => setConfirm(null)}>Cancel</Button><Button className="flex-1" size="lg" disabled={busy} onClick={doReset}>{reset.loading && <Loader2 className="w-4 h-4 animate-spin" />} Reset {state.emptyNow}</Button></div>}
      >
        <p className="text-sm text-steel">All <strong className="text-gray-900">{state.emptyNow} empty cylinders</strong> will move to the refill station:</p>
        <ul className="mt-3 divide-y divide-gray-100 rounded-xl border border-gray-100">
          {lines.map((l) => <li key={l.name} className="flex justify-between px-4 py-3 text-sm"><span>{l.name}</span><strong className="tabular-nums">{l.quantity}</strong></li>)}
        </ul>
        <p className="mt-4 text-sm text-steel">After you refill, come back and tap <strong className="text-gray-900">Refill</strong>.</p>
      </Modal>
    </section>
  );
}
