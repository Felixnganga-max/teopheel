// frontend/src/pages/Customers.jsx
import { useState, useEffect } from 'react';
import { Users, Phone, MapPin, Search, Plus, Building2, Clock } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Field from '../components/ui/Field';
import Pager from '../components/ui/Pager';
import { Spinner, ErrorBox, EmptyState } from '../components/ui/Feedback';
import { useToast } from '../context/ToastContext';
import { useCustomers, useCreateCustomer } from '../api';
import { inputCls } from '../lib/ui';

const LIMIT = 24;
const BLANK = { type: 'corporate', name: '', companyName: '', kraPin: '', email: '', address: '', phone: '', whatsapp: '', creditTermsDays: 30 };

export default function Customers() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(BLANK);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  // debounce search so we don't hit the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => { setQ(search.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data: customers, meta, loading, error, refetch } = useCustomers({ type: type || undefined, q: q || undefined, page, limit: LIMIT });
  const create = useCreateCustomer();

  const submit = async () => {
    const payload = {
      type: form.type,
      name: form.name.trim(),
      phone: form.phone.trim(),
      ...(form.companyName.trim() && { companyName: form.companyName.trim() }),
      ...(form.kraPin.trim() && { kraPin: form.kraPin.trim() }),
      ...(form.email.trim() && { email: form.email.trim() }),
      ...(form.address.trim() && { address: form.address.trim() }),
      ...(form.whatsapp.trim() && { whatsapp: form.whatsapp.trim() }),
      ...(form.type === 'corporate' && { creditTermsDays: Number(form.creditTermsDays) || 0 }),
    };
    try {
      await create.mutate(payload);
      showToast({ type: 'success', message: `${payload.companyName || payload.name} added` });
      setOpen(false);
      setForm(BLANK);
      refetch();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    }
  };

  const valid = form.name.trim() && form.phone.trim() && (form.type !== 'corporate' || form.companyName.trim());

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-accent flex-shrink-0" />
          <span className="text-sm text-steel"><strong className="text-gray-900">{meta?.total ?? '…'}</strong> customers</span>
          <select className={`${inputCls} w-40`} value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
            <option value="">All types</option>
            <option value="individual">Individuals</option>
            <option value="corporate">Corporate</option>
          </select>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel-light" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, company or full phone…" className={`${inputCls} sm:w-80 pl-10`} />
          </div>
          <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4" /> Add customer</Button>
        </div>
      </div>

      {loading && !customers && <Spinner />}
      <ErrorBox error={error} onRetry={refetch} />
      {customers?.length === 0 && <EmptyState icon={Users} message="No customers match" />}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
        {customers?.map((c) => (
          <div key={c._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow animate-fade-in">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold flex-shrink-0">
                  {c.type === 'corporate' ? <Building2 className="w-5 h-5" /> : (c.name || '?').charAt(0)}
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">{c.companyName || c.name}</h4>
                  {c.companyName && <p className="text-xs text-steel truncate">Contact: {c.name}</p>}
                </div>
              </div>
              <Badge variant={c.type === 'corporate' ? 'accent' : 'default'} className="flex-shrink-0">{c.type}</Badge>
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2 text-steel"><Phone className="w-3.5 h-3.5 shrink-0" /><span className="text-gray-800">{c.phone}</span></div>
              {c.address && <div className="flex items-center gap-2 text-steel"><MapPin className="w-3.5 h-3.5 shrink-0" /><span className="text-gray-800 truncate">{c.address}</span></div>}
              {c.type === 'corporate' && <div className="flex items-center gap-2 text-steel"><Clock className="w-3.5 h-3.5 shrink-0" /><span className="text-gray-800">{c.creditTermsDays}-day credit{c.kraPin ? ` · PIN ${c.kraPin}` : ''}</span></div>}
            </div>
          </div>
        ))}
      </div>

      <Pager page={page} limit={LIMIT} total={meta?.total} onChange={setPage} />

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Add customer" size="lg">
        <div className="space-y-4">
          <Field label="Type">
            <select className={inputCls} value={form.type} onChange={(e) => set({ type: e.target.value })}>
              <option value="corporate">Corporate (invoiced, pays later)</option>
              <option value="individual">Individual</option>
            </select>
          </Field>
          {form.type === 'corporate' && <Field label="Company name" required><input className={inputCls} value={form.companyName} onChange={(e) => set({ companyName: e.target.value })} /></Field>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={form.type === 'corporate' ? 'Contact person' : 'Name'} required><input className={inputCls} value={form.name} onChange={(e) => set({ name: e.target.value })} /></Field>
            <Field label="Phone" required><input type="tel" className={inputCls} value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="07XX XXX XXX" /></Field>
            <Field label="WhatsApp (if different)"><input type="tel" className={inputCls} value={form.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} /></Field>
            <Field label="Email"><input type="email" className={inputCls} value={form.email} onChange={(e) => set({ email: e.target.value })} /></Field>
            <Field label="Address" className="sm:col-span-2"><input className={inputCls} value={form.address} onChange={(e) => set({ address: e.target.value })} /></Field>
            {form.type === 'corporate' && (
              <>
                <Field label="KRA PIN"><input className={inputCls} value={form.kraPin} onChange={(e) => set({ kraPin: e.target.value })} /></Field>
                <Field label="Credit terms (days)"><input type="number" min="0" max="120" className={inputCls} value={form.creditTermsDays} onChange={(e) => set({ creditTermsDays: e.target.value })} /></Field>
              </>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="flex-1" disabled={!valid || create.loading} onClick={submit}>Save customer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
