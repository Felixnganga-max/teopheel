import { useState } from 'react';
import { Smartphone } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Field from '../ui/Field';
import { useToast } from '../../context/ToastContext';
import { useSendStk } from '../../api/ordersApi';
import { formatCurrency } from '../../lib/format';
import { inputCls } from '../../lib/ui';

// <SendStkModal order={order|null} onClose={...} onDone={refetch} />
export default function SendStkModal({ order, onClose, onDone }) {
  const { showToast } = useToast();
  const { mutate, loading } = useSendStk();
  const [phone, setPhone] = useState('');

  const close = () => { setPhone(''); onClose(); };

  const submit = async () => {
    try {
      const res = await mutate({ id: order._id, phone: phone.trim() || undefined });
      showToast({ type: 'success', message: res.message });
      close();
      onDone?.();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    }
  };

  return (
    <Modal isOpen={!!order} onClose={close} title={`STK push — ${order?.orderNumber || ''}`} size="sm">
      <div className="space-y-4">
        <div className="bg-accent/5 rounded-xl p-4 text-center">
          <p className="text-xs text-steel-light">Customer will be asked to pay</p>
          <p className="text-2xl font-bold text-accent">{formatCurrency(order?.amount)}</p>
        </div>
        <Field
          label="M-Pesa number"
          hint={order?.customerPhone ? `Leave blank to use ${order.customerPhone}` : 'No number on this order yet. Enter the one that will pay.'}
        >
          <input type="tel" className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XX XXX XXX" />
        </Field>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={close}>Cancel</Button>
          <Button className="flex-1" disabled={loading || (!phone.trim() && !order?.customerPhone)} onClick={submit}><Smartphone className="w-4 h-4" /> Send prompt</Button>
        </div>
      </div>
    </Modal>
  );
}
