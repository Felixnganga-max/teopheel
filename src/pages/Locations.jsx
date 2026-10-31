// frontend/src/pages/Locations.jsx
import { useState } from 'react';
import { MapPin, Plus, Store, Pencil, KeyRound, Power } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Field from '../components/ui/Field';
import { Spinner, ErrorBox, EmptyState } from '../components/ui/Feedback';
import { useToast } from '../context/ToastContext';
import { useLocations, useCreateLocation, useUpdateLocation, useResetAdminPassword } from '../api';
import { inputCls } from '../lib/ui';

const BLANK = { name: '', address: '', contactPhone: '', areas: '', adminName: '', adminEmail: '', adminPassword: '' };
const toAreas = (s) => s.split(',').map((a) => a.trim().toLowerCase()).filter((a) => a.length >= 2);

export default function Locations() {
  const { showToast } = useToast();
  const { data: locations, loading, error, refetch } = useLocations();
  const create = useCreateLocation();
  const update = useUpdateLocation();
  const reset = useResetAdminPassword();

  const [modal, setModal] = useState(null); // 'add' | 'edit' | 'reset'
  const [target, setTarget] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [newPassword, setNewPassword] = useState('');
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const close = () => { setModal(null); setTarget(null); setForm(BLANK); setNewPassword(''); };

  const fail = (err) => showToast({ type: 'error', message: err.message });

  const submitAdd = async () => {
    try {
      await create.mutate({
        name: form.name.trim(),
        address: form.address.trim(),
        ...(form.contactPhone.trim() && { contactPhone: form.contactPhone.trim() }),
        serviceAreas: toAreas(form.areas),
        admin: { name: form.adminName.trim(), email: form.adminEmail.trim(), password: form.adminPassword },
      });
      showToast({ type: 'success', message: `Location "${form.name}" and its admin created` });
      close();
      refetch();
    } catch (err) { fail(err); }
  };

  const openEdit = (l) => { setTarget(l); setForm({ ...BLANK, name: l.name, address: l.address, contactPhone: l.contactPhone || '', areas: l.serviceAreas.join(', ') }); setModal('edit'); };

  const submitEdit = async () => {
    try {
      await update.mutate({
        id: target._id,
        name: form.name.trim(),
        address: form.address.trim(),
        ...(form.contactPhone.trim() && { contactPhone: form.contactPhone.trim() }),
        serviceAreas: toAreas(form.areas),
      });
      showToast({ type: 'success', message: 'Location updated' });
      close();
      refetch();
    } catch (err) { fail(err); }
  };

  const toggleActive = async (l) => {
    try {
      await update.mutate({ id: l._id, active: !l.active });
      showToast({ type: 'success', message: l.active ? `${l.name} deactivated. Its admin can no longer sign in.` : `${l.name} reactivated` });
      refetch();
    } catch (err) { fail(err); }
  };

  const submitReset = async () => {
    try {
      await reset.mutate({ locationId: target.loc._id, adminId: target.admin._id, newPassword });
      showToast({ type: 'success', message: `Password reset for ${target.admin.name}` });
      close();
    } catch (err) { fail(err); }
  };

  const addOk = form.name.trim() && form.address.trim() && form.adminName.trim() && form.adminEmail.trim() && form.adminPassword.length >= 12;

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Store className="w-5 h-5 text-accent" />
          <span className="text-sm text-steel"><strong className="text-gray-900">{locations?.length ?? '…'}</strong> branches</span>
        </div>
        <Button onClick={() => setModal('add')} className="w-full sm:w-auto"><Plus className="w-4 h-4" /> Add location</Button>
      </div>

      {loading && !locations && <Spinner />}
      <ErrorBox error={error} onRetry={refetch} />
      {locations?.length === 0 && <EmptyState icon={MapPin} message="No branches yet" />}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {locations?.map((l) => (
          <div key={l._id} className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow animate-fade-in ${l.active ? '' : 'opacity-60'}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center text-accent font-bold text-sm flex-shrink-0">{l.name.charAt(0)}</div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">{l.name}</h4>
                  <p className="text-xs text-steel truncate">{l.address}</p>
                </div>
              </div>
              <Badge variant={l.active ? 'success' : 'danger'}>{l.active ? 'Active' : 'Inactive'}</Badge>
            </div>

            {l.serviceAreas.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">{l.serviceAreas.map((a) => <Badge key={a}>{a}</Badge>)}</div>
            )}

            <div className="pt-3 border-t border-gray-50 space-y-2">
              <p className="text-xs text-steel-light uppercase tracking-wider">Admin</p>
              {l.admins.length === 0 && <p className="text-sm text-steel">None</p>}
              {l.admins.map((a) => (
                <div key={a._id} className="flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 truncate">{a.name}</p>
                    <p className="text-xs text-steel truncate">{a.email}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => { setTarget({ loc: l, admin: a }); setModal('reset'); }}><KeyRound className="w-3.5 h-3.5" /> Reset</Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(l)}><Pencil className="w-3.5 h-3.5" /> Edit</Button>
              <Button size="sm" variant="ghost" className="flex-1" onClick={() => toggleActive(l)}><Power className="w-3.5 h-3.5" /> {l.active ? 'Deactivate' : 'Activate'}</Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add */}
      <Modal isOpen={modal === 'add'} onClose={close} title="Add location" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Branch name" required><input className={inputCls} value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Kikuyu" /></Field>
            <Field label="Branch phone"><input type="tel" className={inputCls} value={form.contactPhone} onChange={(e) => set({ contactPhone: e.target.value })} /></Field>
            <Field label="Address / area" required className="sm:col-span-2"><input className={inputCls} value={form.address} onChange={(e) => set({ address: e.target.value })} placeholder="Kikuyu town, Nairobi" /></Field>
            <Field label="Areas served" hint="Comma-separated keywords used to match a customer's location, e.g. kikuyu, kinoo, muguga" className="sm:col-span-2"><input className={inputCls} value={form.areas} onChange={(e) => set({ areas: e.target.value })} /></Field>
          </div>
          <p className="text-xs font-semibold text-steel uppercase tracking-wider pt-2">Branch admin login</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full name" required><input className={inputCls} value={form.adminName} onChange={(e) => set({ adminName: e.target.value })} /></Field>
            <Field label="Email" required><input type="email" className={inputCls} value={form.adminEmail} onChange={(e) => set({ adminEmail: e.target.value })} /></Field>
            <Field label="Password" required hint="12+ characters with upper, lower case and a digit" className="sm:col-span-2"><input type="password" autoComplete="new-password" className={inputCls} value={form.adminPassword} onChange={(e) => set({ adminPassword: e.target.value })} /></Field>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={close}>Cancel</Button>
            <Button className="flex-1" disabled={!addOk || create.loading} onClick={submitAdd}><Plus className="w-4 h-4" /> Create</Button>
          </div>
        </div>
      </Modal>

      {/* Edit */}
      <Modal isOpen={modal === 'edit'} onClose={close} title={`Edit ${target?.name || ''}`} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Branch name" required><input className={inputCls} value={form.name} onChange={(e) => set({ name: e.target.value })} /></Field>
            <Field label="Branch phone"><input type="tel" className={inputCls} value={form.contactPhone} onChange={(e) => set({ contactPhone: e.target.value })} /></Field>
            <Field label="Address / area" required className="sm:col-span-2"><input className={inputCls} value={form.address} onChange={(e) => set({ address: e.target.value })} /></Field>
            <Field label="Areas served" hint="Comma-separated" className="sm:col-span-2"><input className={inputCls} value={form.areas} onChange={(e) => set({ areas: e.target.value })} /></Field>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={close}>Cancel</Button>
            <Button className="flex-1" disabled={!form.name.trim() || !form.address.trim() || update.loading} onClick={submitEdit}>Save</Button>
          </div>
        </div>
      </Modal>

      {/* Reset password */}
      <Modal isOpen={modal === 'reset'} onClose={close} title={`Reset password — ${target?.admin?.name || ''}`} size="sm">
        <div className="space-y-4">
          <Field label="New password" required hint="12+ characters with upper, lower case and a digit. They'll be signed out everywhere.">
            <input type="password" autoComplete="new-password" className={inputCls} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </Field>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={close}>Cancel</Button>
            <Button className="flex-1" disabled={newPassword.length < 12 || reset.loading} onClick={submitReset}>Reset</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
