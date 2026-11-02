// frontend/src/pages/MixBrands.jsx  (owner only)
// Pick a brand, tick the brands customers may hand back when we deliver it. Applies to every size both brands sell.
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Repeat, Check, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';
import { Spinner, ErrorBox, EmptyState } from '../components/ui/Feedback';
import { useToast } from '../context/ToastContext';
import { useProducts, useSetBrandCompatibility } from '../api';

const sizesOf = (products, brand) => [...new Set(products.filter((p) => p.brand === brand).map((p) => p.sizeKg))].sort((a, b) => a - b);

export default function MixBrands() {
  const { showToast } = useToast();
  const [params, setParams] = useSearchParams();
  const { data: products, loading, error, refetch } = useProducts();
  const save = useSetBrandCompatibility();
  const [edits, setEdits] = useState({}); // { [brand]: [brands ticked but not saved yet] }

  const list = products || [];
  const brands = [...new Set(list.map((p) => p.brand))].sort();
  const brand = brands.includes(params.get('brand')) ? params.get('brand') : brands[0];

  // What a brand swaps with today = every brand listed on any of its sizes
  const savedFor = (b) => [...new Set(list.filter((p) => p.brand === b).flatMap((p) => (p.compatibleWith || []).map((c) => c.brand)))].sort();
  const picks = edits[brand] ?? savedFor(brand);
  const dirty = brand && JSON.stringify([...picks].sort()) !== JSON.stringify(savedFor(brand));
  const toggle = (b) => setEdits((e) => ({ ...e, [brand]: picks.includes(b) ? picks.filter((x) => x !== b) : [...picks, b] }));

  const handleSave = async () => {
    try {
      const res = await save.mutate({ brand, compatibleBrands: picks });
      showToast({ type: 'success', message: `${brand}: swaps saved for ${res.data.length} size${res.data.length === 1 ? '' : 's'}` });
      setEdits((e) => Object.fromEntries(Object.entries(e).filter(([k]) => k !== brand)));
      refetch();
    } catch (err) { showToast({ type: 'error', message: err.message }); }
  };

  return (
    <div className="p-4 md:p-8 pb-28">
      <div className="flex items-start gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0"><Repeat className="w-5 h-5 text-accent" /></div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Mix Brands</h2>
          <p className="text-sm text-steel">Choose a brand, then tick the brands whose empty cylinders a customer can hand back for it. For example, Pro Gas empties for an Afri Gas refill.</p>
        </div>
      </div>

      {loading && !products && <Spinner />}
      <ErrorBox error={error} onRetry={refetch} />
      {products && brands.length < 2 && <EmptyState icon={Repeat} message="Add at least two gas brands first, then you can mix them here." />}

      {brands.length >= 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
          {/* 1. pick the brand being delivered */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-steel px-2 pb-2">1. Brand we deliver</p>
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
              {brands.map((b) => {
                const n = (edits[b] ?? savedFor(b)).length;
                const active = b === brand;
                return (
                  <button
                    key={b} type="button" onClick={() => setParams({ brand: b })}
                    className={`shrink-0 text-left px-4 py-3 rounded-xl border-2 transition cursor-pointer ${active ? 'border-accent bg-accent/5' : 'border-transparent hover:bg-gray-50'}`}
                  >
                    <span className="block font-semibold text-gray-900">{b}</span>
                    <span className="block text-xs text-steel">{sizesOf(list, b).map((s) => `${s}kg`).join(', ')} · {n ? `mixes with ${n}` : 'no mixing'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. tick the brands that can come back */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-steel mb-1">2. Empties we accept</p>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">When we deliver <span className="text-accent">{brand}</span> <ArrowRight className="w-4 h-4 text-steel-light" /> customers can return:</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {brands.filter((b) => b !== brand).map((b) => {
                const on = picks.includes(b);
                const shared = sizesOf(list, b).filter((s) => sizesOf(list, brand).includes(s));
                return (
                  <button
                    key={b} type="button" onClick={() => toggle(b)} aria-pressed={on}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition cursor-pointer ${on ? 'border-accent bg-accent/5' : 'border-gray-100 hover:border-gray-200'}`}
                  >
                    <span className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${on ? 'bg-accent text-shell' : 'border border-gray-300'}`}>{on && <Check className="w-4 h-4" />}</span>
                    <span>
                      <span className="block font-medium text-gray-900">{b}</span>
                      <span className="block text-xs text-steel">{shared.length ? `Same sizes: ${shared.map((s) => `${s}kg`).join(', ')}` : 'No matching size, nothing to swap'}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-steel mt-4">Only cylinders of the same size can be swapped. It works both ways: ticking Afri Gas here also lets {brand} empties come back on Afri Gas deliveries.</p>
          </div>
        </div>
      )}

      {/* Save bar: always on screen, so it can't be missed */}
      {brands.length >= 2 && (
        <div className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-gray-100 px-4 py-3 flex items-center justify-between gap-3 lg:pl-64">
          <span className="text-sm text-steel">{dirty ? <>Unsaved changes for <strong className="text-gray-900">{brand}</strong></> : 'All changes saved'}</span>
          <Button disabled={!dirty || save.loading} onClick={handleSave}>{save.loading ? 'Saving…' : 'Save'}</Button>
        </div>
      )}
    </div>
  );
}
