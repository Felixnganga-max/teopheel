import { useState } from 'react';
import { Banknote } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Field from '../ui/Field';
import { useToast } from '../../context/ToastContext';
import { useRecordCash } from '../../api/cashApi';
import { formatCurrency } from '../../lib/format';
import { inputCls } from '../../lib/ui';

// <RecordCashModal order={order|null} onClose={...} onDone={refetch} />
export default function RecordCashModal({ order, onClose, onDone }) {
  const { showToast } = useToast();
  const { mutate, loading } = useRecordCash();
  const [handedBy, setHandedBy] = useState(null); // null = use the order's rider name
  const [note, setNote] = useState('');

  const close = () => { setHandedBy(null); setNote(''); onClose(); };

  const submit = async () => {
    try {
      const by = (handedBy ?? order.rider?.name ?? '').trim();
      await mutate({ orderId: order._id, ...(by && { handedBy: by }), ...(note.trim() && { note: note.trim() }) });
      showToast({ type: 'success', message: `Cash recorded for ${order.orderNumber}` });
      close();
      onDone?.();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    }
  };

  return (
    <Modal isOpen={!!order} onClose={close} title={`Record cash — ${order?.orderNumber || ''}`} size="sm">
      <div className="space-y-4">
        <div className="bg-accent/5 rounded-xl p-4 text-center">
          <p className="text-xs text-steel-light">Cash received</p>
          <p className="text-2xl font-bold text-accent">{formatCurrency(order?.amount)}</p>
          <p className="text-xs text-steel mt-1">Only record this after you are holding the full amount.</p>
        </div>
        <Field label="Handed over by" hint="Rider or person who brought the cash">
          <input className={inputCls} value={handedBy ?? order?.rider?.name ?? ''} onChange={(e) => setHandedBy(e.target.value)} placeholder="Rider name" />
        </Field>
        <Field label="Note (optional)">
          <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={close}>Cancel</Button>
          <Button className="flex-1" disabled={loading} onClick={submit}><Banknote className="w-4 h-4" /> Confirm cash</Button>
        </div>
      </div>
    </Modal>
  );
}
