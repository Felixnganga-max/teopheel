// frontend/src/pages/Products.jsx  (owner only: gas brands)
import { useState } from 'react';
import { Tag, Plus, Pencil, Power, ImagePlus, Package, Repeat } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Field from '../components/ui/Field';
import { Spinner, ErrorBox, EmptyState } from '../components/ui/Feedback';
import { useToast } from '../context/ToastContext';
import { useProducts, useCreateProduct, useUpdateProduct, useSetProductCompatibility, useSetBrandCompatibility } from '../api';
import { formatCurrency } from '../lib/format';
import { inputCls } from '../lib/ui';

const BLANK = { brand: '', sizeKg: '', refillPrice: '', fullPrice: '', image: null };

export default function Products() {
  const { showToast } = useToast();
  const { data: products, loading, error, refetch } = useProducts();
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const setCompat = useSetProductCompatibility();
  const setBrandCompat = useSetBrandCompatibility();

  // Compatibility editors
  const [compatFor, setCompatFor] = useState(null); // product being edited
  const [compatIds, setCompatIds] = useState([]);
  const [brandOpen, setBrandOpen] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [brandPicks, setBrandPicks] = useState([]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [preview, setPreview] = useState(null);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const close = () => { setOpen(false); setEditing(null); setForm(BLANK); if (preview) URL.revokeObjectURL(preview); setPreview(null); };
  const openAdd = () => { setEditing(null); setForm(BLANK); setOpen(true); };
  const openEdit = (p) => { setEditing(p); setForm({ brand: p.brand, sizeKg: p.sizeKg, refillPrice: p.refillPrice, fullPrice: p.fullPrice, image: null }); setOpen(true); };

  const pickImage = (file) => {
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    set({ image: file });
  };

  const submit = async () => {
    const payload = { brand: form.brand.trim(), sizeKg: Number(form.sizeKg), refillPrice: Number(form.refillPrice), fullPrice: Number(form.fullPrice), image: form.image };
    try {
      if (editing) await update.mutate({ id: editing._id, ...payload });
      else await create.mutate(payload);
      showToast({ type: 'success', message: editing ? 'Product updated' : 'Product added' });
      close();
      refetch();
    } catch (err) { showToast({ type: 'error', message: err.message }); }
  };

  const toggle = async (p) => {
    try {
      await update.mutate({ id: p._id, active: !p.active });
      refetch();
    } catch (err) { showToast({ type: 'error', message: err.message }); }
  };

  const brands = [...new Set((products || []).map((p) => p.brand))].sort();

  const openCompat = (p) => { setCompatFor(p); setCompatIds((p.compatibleWith || []).map((c) => c._id)); };
  const toggle_ = (list, setList, v) => setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const saveCompat = async () => {
    try {
      await setCompat.mutate({ id: compatFor._id, compatibleProductIds: compatIds });
      showToast({ type: 'success', message: 'Compatible brands saved' });
      setCompatFor(null);
      refetch();
    } catch (err) { showToast({ type: 'error', message: err.message }); }
  };
  const pickBrand = (b) => {
    setBrandName(b);
    // pre-tick the brands every size of this brand already swaps with
    const mine = (products || []).filter((p) => p.brand === b);
    setBrandPicks([...new Set(mine.flatMap((p) => (p.compatibleWith || []).map((c) => c.brand)))]);
  };
  const saveBrandCompat = async () => {
    try {
      const res = await setBrandCompat.mutate({ brand: brandName, compatibleBrands: brandPicks });
      showToast({ type: 'success', message: `${brandName}: swaps set for ${res.data.length} size${res.data.length === 1 ? '' : 's'}` });
      setBrandOpen(false);
      refetch();
    } catch (err) { showToast({ type: 'error', message: err.message }); }
  };

  const valid = form.brand.trim() && Number(form.sizeKg) > 0 && form.refillPrice !== '' && form.fullPrice !== '' && (editing || form.image);
  const busy = create.loading || update.loading;

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Tag className="w-5 h-5 text-accent" />
          <span className="text-sm text-steel"><strong className="text-gray-900">{products?.length ?? '…'}</strong> brand / size combinations</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => { setBrandName(''); setBrandPicks([]); setBrandOpen(true); }} disabled={brands.length < 2}><Repeat className="w-4 h-4" /> Swappable brands</Button>
          <Button onClick={openAdd}><Plus className="w-4 h-4" /> Add gas brand</Button>
        </div>
      </div>

      {loading && !products && <Spinner />}
      <ErrorBox error={error} onRetry={refetch} />
      {products?.length === 0 && <EmptyState icon={Package} message="No gas brands yet. Add one to start taking orders." />}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {products?.map((p) => (
          <div key={p._id} className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-fade-in ${p.active ? '' : 'opacity-60'}`}>
            <div className="flex items-center gap-4">
              {p.image?.url ? <img src={p.image.url} alt={p.brand} className="w-20 h-20 object-contain rounded-xl bg-card flex-shrink-0" /> : <div className="w-20 h-20 rounded-xl bg-card flex items-center justify-center"><Package className="w-7 h-7 text-steel-light" /></div>}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-gray-900 truncate">{p.name}</h4>
                  {!p.active && <Badge variant="danger">Inactive</Badge>}
                </div>
                <p className="text-xs text-steel mt-1">Refill <strong className="text-gray-900">{formatCurrency(p.refillPrice)}</strong></p>
                <p className="text-xs text-steel">Whole cylinder <strong className="text-gray-900">{formatCurrency(p.fullPrice)}</strong></p>
              </div>
            </div>
            <div className="mt-4 text-xs text-steel flex items-start gap-1.5">
              <Repeat className="w-3.5 h-3.5 mt-0.5 text-accent flex-shrink-0" />
              {p.compatibleWith?.length ? <span>Swaps with <strong className="text-gray-900">{p.compatibleWith.map((c) => c.brand).join(', ')}</strong></span> : <span className="text-steel-light">No swappable brands</span>}
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(p)}><Pencil className="w-3.5 h-3.5" /> Edit</Button>
              <Button size="sm" variant="ghost" className="flex-1" onClick={() => toggle(p)}><Power className="w-3.5 h-3.5" /> {p.active ? 'Deactivate' : 'Activate'}</Button>
            </div>
            <Button size="sm" variant="secondary" className="w-full mt-2" onClick={() => openCompat(p)}><Repeat className="w-3.5 h-3.5" /> Compatible brands</Button>
          </div>
        ))}
      </div>


      <Modal isOpen={!!compatFor} onClose={() => setCompatFor(null)} title={`Swaps for ${compatFor?.name || ''}`}>
        <div className="space-y-4">
          <p className="text-sm text-steel">Tick the {compatFor?.sizeKg}kg cylinders a customer can hand back when you deliver {compatFor?.name}. It works both ways.</p>
          {(() => {
            const same = (products || []).filter((p) => compatFor && p._id !== compatFor._id && p.sizeKg === compatFor.sizeKg);
            if (!same.length) return <p className="text-sm text-danger">No other {compatFor?.sizeKg}kg brands yet. Add them first.</p>;
            return same.map((p) => (
              <label key={p._id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 cursor-pointer hover:bg-card">
                <input type="checkbox" className="w-4 h-4 accent-[#C9A84C]" checked={compatIds.includes(p._id)} onChange={() => toggle_(compatIds, setCompatIds, p._id)} />
                {p.image?.url ? <img src={p.image.url} alt="" className="w-9 h-9 object-contain rounded bg-card" /> : <Package className="w-5 h-5 text-steel-light" />}
                <span className="text-sm font-medium text-gray-800">{p.name}</span>
                {!p.active && <Badge variant="danger">Inactive</Badge>}
              </label>
            ));
          })()}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setCompatFor(null)}>Cancel</Button>
            <Button className="flex-1" disabled={setCompat.loading} onClick={saveCompat}>Save</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={brandOpen} onClose={() => setBrandOpen(false)} title="Swappable brands">
        <div className="space-y-4">
          <p className="text-sm text-steel">Pick a brand, then tick every brand that can be swapped for it. This applies to each size both brands sell.</p>
          <Field label="Brand">
            <select className={inputCls} value={brandName} onChange={(e) => pickBrand(e.target.value)}>
              <option value="">Select brand…</option>
              {brands.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </Field>
          {brandName && brands.filter((b) => b !== brandName).map((b) => (
            <label key={b} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 cursor-pointer hover:bg-card">
              <input type="checkbox" className="w-4 h-4 accent-[#C9A84C]" checked={brandPicks.includes(b)} onChange={() => toggle_(brandPicks, setBrandPicks, b)} />
              <span className="text-sm font-medium text-gray-800">{b}</span>
            </label>
          ))}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setBrandOpen(false)}>Cancel</Button>
            <Button className="flex-1" disabled={!brandName || setBrandCompat.loading} onClick={saveBrandCompat}>Save</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={open} onClose={close} title={editing ? `Edit ${editing.name}` : 'Add gas brand'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Brand" required><input className={inputCls} value={form.brand} onChange={(e) => set({ brand: e.target.value })} placeholder="e.g. K-Gas" /></Field>
            <Field label="Size (kg)" required><input type="number" min="0.5" step="0.5" className={inputCls} value={form.sizeKg} onChange={(e) => set({ sizeKg: e.target.value })} /></Field>
            <Field label="Refill price (KES)" required><input type="number" min="0" className={inputCls} value={form.refillPrice} onChange={(e) => set({ refillPrice: e.target.value })} /></Field>
            <Field label="Whole cylinder price (KES)" required><input type="number" min="0" className={inputCls} value={form.fullPrice} onChange={(e) => set({ fullPrice: e.target.value })} /></Field>
          </div>
          <Field label={editing ? 'Replace image (optional)' : 'Brand image'} required={!editing} hint="JPEG, PNG or WebP, up to 2MB">
            <label className="flex items-center gap-4 p-3 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-card">
              {preview || editing?.image?.url ? <img src={preview || editing.image.url} alt="" className="w-16 h-16 object-contain rounded bg-card" /> : <ImagePlus className="w-8 h-8 text-steel-light" />}
              <span className="text-sm text-steel">{form.image ? form.image.name : 'Choose image…'}</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pickImage(e.target.files?.[0])} />
            </label>
          </Field>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={close}>Cancel</Button>
            <Button className="flex-1" disabled={!valid || busy} onClick={submit}>{editing ? 'Save' : 'Add'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
