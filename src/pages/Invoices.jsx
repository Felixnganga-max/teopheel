// frontend/src/pages/Invoices.jsx
import { useState } from 'react';
import { FileText, MessageCircle, CheckCircle2, Ban, Filter, ExternalLink } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Field from '../components/ui/Field';
import Pager from '../components/ui/Pager';
import { Spinner, ErrorBox, EmptyState } from '../components/ui/Feedback';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useInvoices, useShareInvoice, useMarkInvoicePaid, useVoidInvoice, openInvoicePdf, openWhatsApp } from '../api';
import { formatCurrency, formatDate } from '../lib/format';
import { inputCls } from '../lib/ui';

const FILTERS = ['all', 'unpaid', 'paid', 'void'];
const VARIANT = { unpaid: 'warning', paid: 'success', void: 'default' };
const LIMIT = 20;

export default function Invoices() {
  const { isOwner } = useAuth();
  const { showToast } = useToast();
  const [filter, setFilter] = useState('unpaid');
  const [page, setPage] = useState(1);
  const [payTarget, setPayTarget] = useState(null);
  const [ref, setRef] = useState('');

  const { data: invoices, meta, loading, error, refetch } = useInvoices({ status: filter === 'all' ? undefined : filter, page, limit: LIMIT });
  const share = useShareInvoice();
  const markPaid = useMarkInvoicePaid();
  const voidInv = useVoidInvoice();

  const fail = (err) => showToast({ type: 'error', message: err.message });

  const handleShare = async (inv) => {
    try {
      const res = await share.mutate({ id: inv._id });
      openWhatsApp(res.data.whatsappLink);
    } catch (err) { fail(err); }
  };

  const handlePay = async () => {
    try {
      await markPaid.mutate({ id: payTarget._id, paymentRef: ref.trim() });
      showToast({ type: 'success', message: `${payTarget.invoiceNumber} marked paid` });
      setPayTarget(null);
      setRef('');
      refetch();
    } catch (err) { fail(err); }
  };

  const handleVoid = async (inv) => {
    if (!window.confirm(`Void ${inv.invoiceNumber}? This cannot be undone.`)) return;
    try {
      await voidInv.mutate(inv._id);
      showToast({ type: 'success', message: `${inv.invoiceNumber} voided` });
      refetch();
    } catch (err) { fail(err); }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-steel" />
        <div className="flex flex-wrap bg-white rounded-lg p-1 border border-gray-100">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => { setFilter(f); setPage(1); }}
              className={`px-3 sm:px-4 py-1.5 rounded-md text-xs font-semibold capitalize transition-all cursor-pointer ${filter === f ? 'bg-accent text-shell shadow-sm' : 'text-steel hover:text-gray-700'}`}>{f}</button>
          ))}
        </div>
      </div>

      {loading && !invoices && <Spinner />}
      <ErrorBox error={error} onRetry={refetch} />
      {invoices?.length === 0 && <EmptyState icon={FileText} message="No invoices here" />}

      {invoices?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-card-dark/50 border-b border-gray-100">
              <tr>{['Invoice', 'Client', 'Amount', 'Due', 'Status', ''].map((h, i) => <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-steel-light uppercase tracking-wider">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {invoices.map((inv) => (
                <tr key={inv._id} className="hover:bg-card-dark/30">
                  <td className="px-4 py-3 font-medium text-gray-900">{inv.invoiceNumber}<p className="text-xs text-steel-light font-normal">{formatDate(inv.issueDate)}</p></td>
                  <td className="px-4 py-3 text-gray-800">{inv.billTo?.companyName || inv.billTo?.name}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(inv.total)}</td>
                  <td className="px-4 py-3 text-steel">{formatDate(inv.dueDate)}</td>
                  <td className="px-4 py-3 flex gap-1.5 flex-wrap">
                    <Badge variant={VARIANT[inv.status]}>{inv.status}</Badge>
                    {inv.overdue && <Badge variant="danger">Overdue</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5 flex-wrap">
                      <Button size="sm" variant="ghost" onClick={() => openInvoicePdf(inv._id).catch(fail)}><ExternalLink className="w-3.5 h-3.5" /> PDF</Button>
                      {inv.status !== 'void' && <Button size="sm" variant="outline" onClick={() => handleShare(inv)}><MessageCircle className="w-3.5 h-3.5" /> WhatsApp</Button>}
                      {inv.status === 'unpaid' && <Button size="sm" onClick={() => setPayTarget(inv)}><CheckCircle2 className="w-3.5 h-3.5" /> Mark paid</Button>}
                      {inv.status === 'unpaid' && isOwner && <Button size="sm" variant="ghost" onClick={() => handleVoid(inv)}><Ban className="w-3.5 h-3.5" /> Void</Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pager page={page} limit={LIMIT} total={meta?.total} onChange={setPage} />

      <Modal isOpen={!!payTarget} onClose={() => setPayTarget(null)} title={`Mark ${payTarget?.invoiceNumber || ''} paid`} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-steel">{formatCurrency(payTarget?.total)} from {payTarget?.billTo?.companyName || payTarget?.billTo?.name}</p>
          <Field label="Payment reference" required hint="M-Pesa code, cheque or bank reference">
            <input className={inputCls} value={ref} onChange={(e) => setRef(e.target.value)} />
          </Field>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setPayTarget(null)}>Cancel</Button>
            <Button className="flex-1" disabled={!ref.trim() || markPaid.loading} onClick={handlePay}>Confirm</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
