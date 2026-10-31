// frontend/src/pages/Sales.jsx
import { useState } from 'react';
import {
  User, MapPin, Package, Send, Phone, CheckCircle2, ArrowLeft, ArrowRight, Copy,
  MessageCircle, FileText, Loader2, Minus, Plus, Building2, Smartphone,
} from 'lucide-react';
import Stepper from '../components/ui/Stepper';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Field from '../components/ui/Field';
import { Spinner, ErrorBox, EmptyState } from '../components/ui/Feedback';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAvailableStock, useDispatchOrder, useLocations, useCustomers, openWhatsApp, openInvoicePdf } from '../api';
import { formatCurrency, copyText } from '../lib/format';
import { inputCls } from '../lib/ui';

const STEPS = [{ label: 'Customer' }, { label: 'Cylinder' }, { label: 'Payment' }, { label: 'Dispatch' }];

const INITIAL = {
  customerName: '',
  deliveryAddress: '',
  locationId: '',
  orderType: 'refill',
  productId: '',
  quantity: 1,
  paymentMode: 'instant',
  phone: '',
  customerId: '',
  invoiceWhatsapp: '',
  riderName: '',
  riderPhone: '',
};

// Hooks may return the raw array, or a wrapper like { success, data: [...] }.
// Always hand the component a real array.
const toArray = (v) => (Array.isArray(v) ? v : Array.isArray(v?.data) ? v.data : []);

function Choice({ active, onClick, icon: Icon, title, text }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
        active ? 'border-accent bg-accent/5' : 'border-gray-100 bg-white hover:border-gray-200'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${active ? 'text-accent' : 'text-steel-light'}`} />
        <span className="font-semibold text-sm text-gray-900">{title}</span>
      </div>
      <p className="text-xs text-steel">{text}</p>
    </button>
  );
}

export default function Sales() {
  const { isOwner } = useAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL);
  const [result, setResult] = useState(null);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const { data: locationsRaw } = useLocations({ enabled: isOwner });
  const locations = toArray(locationsRaw);

  const stockEnabled = step === 1 && (!isOwner || !!form.locationId);
  const { data: stockRaw, loading: stockLoading, error: stockError, refetch } = useAvailableStock(
    { locationId: isOwner ? form.locationId : undefined },
    { enabled: stockEnabled }
  );
  const stock = toArray(stockRaw);

  const { data: corporatesRaw, loading: corpLoading } = useCustomers(
    { type: 'corporate', limit: 100 },
    { enabled: step === 2 && form.paymentMode === 'invoice' }
  );
  const corporates = toArray(corporatesRaw);

  const { mutate: dispatch, loading: dispatching } = useDispatchOrder();

  const selected = stock.find((r) => r.product._id === form.productId);
  const unitPrice = selected ? (form.orderType === 'refill' ? selected.product.refillPrice : selected.product.fullPrice) : 0;
  const total = unitPrice * form.quantity;
  const corporate = corporates.find((c) => c._id === form.customerId);

  const canProceed = () => {
    if (step === 0) return form.deliveryAddress.trim() && form.customerName.trim() && (!isOwner || form.locationId);
    if (step === 1) return !!selected && form.quantity >= 1 && form.quantity <= selected.full && unitPrice > 0;
    if (step === 2) return form.paymentMode === 'instant' || !!form.customerId;
    return true;
  };

  const handleDispatch = async () => {
    const payload = {
      customerName: form.customerName.trim(),
      deliveryAddress: form.deliveryAddress.trim(),
      productId: form.productId,
      orderType: form.orderType,
      quantity: form.quantity,
      paymentMode: form.paymentMode,
    };
    if (isOwner) payload.locationId = form.locationId;
    if (form.phone.trim()) payload.phone = form.phone.trim();
    if (form.paymentMode === 'invoice') {
      payload.customerId = form.customerId;
      if (form.invoiceWhatsapp.trim()) payload.invoiceWhatsapp = form.invoiceWhatsapp.trim();
    }
    if (form.riderName.trim()) {
      payload.rider = { name: form.riderName.trim(), ...(form.riderPhone.trim() && { phone: form.riderPhone.trim() }) };
    }
    try {
      const res = await dispatch(payload);
      setResult(res.data);
      showToast({ type: 'success', message: `Order ${res.data.order.orderNumber} dispatched` });
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    }
  };

  const reset = () => {
    setStep(0);
    setForm({ ...INITIAL, locationId: isOwner ? form.locationId : '' });
    setResult(null);
  };

  const copy = async (text) => {
    const ok = await copyText(text);
    showToast({ type: ok ? 'success' : 'error', message: ok ? 'Copied' : 'Could not copy' });
  };

  /* ---------- Result ---------- */
  if (result) {
    const { order, payLink, invoice, whatsapp } = result;
    const sms = order.sms?.status;
    return (
      <div className="p-4 sm:p-8 max-w-2xl mx-auto animate-fade-in">
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-5">
          <div className="flex items-center gap-2 text-success">
            <CheckCircle2 className="w-6 h-6" />
            <span className="font-semibold text-lg">Order {order.orderNumber} dispatched</span>
          </div>
          <p className="text-sm text-steel">
            {order.productSnapshot.name} × {order.quantity} ({order.orderType === 'refill' ? 'refill' : 'new cylinder'}) to {order.deliveryAddress} · {formatCurrency(order.amount)}
          </p>

          <div className="flex flex-wrap gap-2">
            {sms === 'sent' && <Badge variant="success">SMS sent</Badge>}
            {sms === 'failed' && <Badge variant="danger">SMS failed — use Orders to resend</Badge>}
            {(!sms || sms === 'none') && <Badge variant="warning">No phone yet — add it in Orders</Badge>}
            {invoice && <Badge variant="accent">Invoice {invoice.invoiceNumber}</Badge>}
          </div>

          {payLink && (
            <div className="bg-accent/5 rounded-xl p-4">
              <p className="text-xs text-steel-light mb-1">Payment link (read it out if the SMS doesn’t arrive)</p>
              <div className="flex items-center gap-2">
                <code className="text-xs text-gray-800 break-all flex-1">{payLink}</code>
                <Button size="sm" variant="outline" onClick={() => copy(payLink)}><Copy className="w-3.5 h-3.5" /> Copy</Button>
              </div>
            </div>
          )}

          {invoice && (
            <div className="bg-accent/5 rounded-xl p-4 space-y-3">
              <p className="text-sm text-gray-700">
                Invoice <strong>{invoice.invoiceNumber}</strong> for {formatCurrency(invoice.total)} created. Share it with the client:
              </p>
              <div className="flex flex-wrap gap-2">
                {whatsapp ? (
                  <Button size="sm" onClick={() => openWhatsApp(whatsapp.whatsappLink)}><MessageCircle className="w-4 h-4" /> Share on WhatsApp</Button>
                ) : (
                  <span className="text-xs text-danger">No WhatsApp number on file — share from Invoices.</span>
                )}
                <Button size="sm" variant="outline" onClick={() => openInvoicePdf(invoice._id).catch((e) => showToast({ type: 'error', message: e.message }))}>
                  <FileText className="w-4 h-4" /> View PDF
                </Button>
              </div>
            </div>
          )}

          <Button className="w-full" onClick={reset}>New Order <ArrowRight className="w-4 h-4" /></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <Stepper steps={STEPS} currentStep={step} />

      {/* Step 0: customer */}
      {step === 0 && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm animate-fade-in space-y-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center"><MapPin className="w-5 h-5 text-accent" /></div>
            <div>
              <h3 className="font-semibold text-gray-900">Customer & delivery</h3>
              <p className="text-sm text-steel">Who is calling and where should we deliver?</p>
            </div>
          </div>

          {isOwner && (
            <Field label="Dispatch from branch" required>
              <select className={inputCls} value={form.locationId} onChange={(e) => set({ locationId: e.target.value, productId: '' })}>
                <option value="">Select branch…</option>
                {locations.filter((l) => l.active !== false).map((l) => <option key={l._id} value={l._id}>{l.name} — {l.address}</option>)}
              </select>
            </Field>
          )}

          <Field label="Customer name" required>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel-light" />
              <input className={`${inputCls} pl-10`} value={form.customerName} onChange={(e) => set({ customerName: e.target.value })} placeholder="Full name" />
            </div>
          </Field>

          <Field label="Delivery location" required hint="Area, street, landmark">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel-light" />
              <input className={`${inputCls} pl-10`} value={form.deliveryAddress} onChange={(e) => set({ deliveryAddress: e.target.value })} placeholder="e.g. Kikuyu, Kinoo Road, near the Total station" />
            </div>
          </Field>

          <Field label="What is the customer buying?">
            <div className="flex flex-col sm:flex-row gap-3">
              <Choice active={form.orderType === 'refill'} onClick={() => set({ orderType: 'refill' })} icon={Package} title="Gas refill" text="Customer swaps their empty cylinder for a full one" />
              <Choice active={form.orderType === 'full_purchase'} onClick={() => set({ orderType: 'full_purchase' })} icon={Package} title="Whole cylinder" text="New cylinder with gas, no empty is taken back" />
            </div>
          </Field>
        </div>
      )}

      {/* Step 1: cylinder */}
      {step === 1 && (
        <div className="animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center"><Package className="w-5 h-5 text-accent" /></div>
            <div>
              <h3 className="font-semibold text-gray-900">Choose cylinder</h3>
              <p className="text-sm text-steel">Full cylinders in stock at this branch</p>
            </div>
          </div>

          {stockLoading && <Spinner />}
          <ErrorBox error={stockError} onRetry={refetch} />
          {!stockLoading && !stockError && stock.length === 0 && <EmptyState icon={Package} message="No full cylinders in stock at this branch" />}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stock.map((row) => {
              const p = row.product;
              const price = form.orderType === 'refill' ? p.refillPrice : p.fullPrice;
              const active = form.productId === p._id;
              return (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => set({ productId: p._id, quantity: 1 })}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-4 ${
                    active ? 'border-accent bg-accent/5 shadow-md shadow-accent/10' : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                  }`}
                >
                  {p.image?.url ? (
                    <img src={p.image.url} alt={p.brand} className="w-14 h-14 object-contain rounded-lg bg-card flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-card flex items-center justify-center flex-shrink-0"><Package className="w-6 h-6 text-steel-light" /></div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                    <p className="text-lg font-bold text-accent">{price ? formatCurrency(price) : 'No price'}</p>
                  </div>
                  <Badge variant={row.full <= 3 ? 'warning' : 'success'}>{row.full} in stock</Badge>
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="mt-5 bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Quantity</span>
              <div className="flex items-center gap-3">
                <Button size="sm" variant="secondary" disabled={form.quantity <= 1} onClick={() => set({ quantity: form.quantity - 1 })}><Minus className="w-4 h-4" /></Button>
                <span className="w-8 text-center font-semibold">{form.quantity}</span>
                <Button size="sm" variant="secondary" disabled={form.quantity >= selected.full} onClick={() => set({ quantity: form.quantity + 1 })}><Plus className="w-4 h-4" /></Button>
              </div>
              <span className="font-bold text-accent">{formatCurrency(total)}</span>
            </div>
          )}
        </div>
      )}

      {/* Step 2: payment */}
      {step === 2 && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm animate-fade-in space-y-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <Choice active={form.paymentMode === 'instant'} onClick={() => set({ paymentMode: 'instant' })} icon={Smartphone} title="Pay now (M-Pesa)" text="Customer gets an SMS with a payment link" />
            <Choice active={form.paymentMode === 'invoice'} onClick={() => set({ paymentMode: 'invoice' })} icon={Building2} title="Invoice (pay later)" text="Corporate client — invoice PDF shared on WhatsApp" />
          </div>

          {form.paymentMode === 'instant' ? (
            <Field label="Customer phone" hint="Leave blank to add it later in Orders. The SMS and payment link go out as soon as you save a number.">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel-light" />
                <input type="tel" className={`${inputCls} pl-10`} value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="07XX XXX XXX" />
              </div>
            </Field>
          ) : (
            <>
              <Field label="Corporate customer" required hint="Add new corporate clients under Customers.">
                {corpLoading ? <Spinner className="py-4" /> : (
                  <select className={inputCls} value={form.customerId} onChange={(e) => set({ customerId: e.target.value })}>
                    <option value="">Select company…</option>
                    {corporates.map((c) => <option key={c._id} value={c._id}>{c.companyName || c.name}</option>)}
                  </select>
                )}
                {!corpLoading && corporates.length === 0 && <p className="text-xs text-danger mt-1">No corporate customers yet.</p>}
              </Field>
              <Field label="Caller's phone (optional)" hint="Receives the dispatch SMS, and the invoice on WhatsApp unless you set another number below.">
                <input type="tel" className={inputCls} value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="07XX XXX XXX" />
              </Field>
              <Field label="Send invoice to a different WhatsApp number (optional)">
                <input type="tel" className={inputCls} value={form.invoiceWhatsapp} onChange={(e) => set({ invoiceWhatsapp: e.target.value })} placeholder="07XX XXX XXX" />
              </Field>
              {corporate && <p className="text-xs text-steel-light">Credit terms: {corporate.creditTermsDays} days</p>}
            </>
          )}
        </div>
      )}

      {/* Step 3: review + dispatch */}
      {step === 3 && (
        <div className="animate-fade-in space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-5">Order summary</h3>
            <div className="space-y-3 text-sm">
              {[
                ['Customer', form.customerName],
                ['Delivery', form.deliveryAddress],
                ['Item', `${selected?.product.name} × ${form.quantity} (${form.orderType === 'refill' ? 'refill' : 'new cylinder'})`],
                ['Payment', form.paymentMode === 'instant' ? 'M-Pesa link' : `Invoice — ${corporate?.companyName || corporate?.name || ''}`],
                ['Phone', form.phone.trim() || 'Not entered yet'],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-50 gap-1">
                  <span className="text-steel">{k}</span>
                  <span className="font-medium text-gray-900">{v}</span>
                </div>
              ))}
              <div className="flex flex-col sm:flex-row sm:justify-between py-3">
                <span className="text-steel font-medium">Total</span>
                <span className="text-xl font-bold text-accent">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Rider (optional)"><input className={inputCls} value={form.riderName} onChange={(e) => set({ riderName: e.target.value })} placeholder="Rider name" /></Field>
            <Field label="Rider phone (optional)"><input type="tel" className={inputCls} value={form.riderPhone} onChange={(e) => set({ riderPhone: e.target.value })} placeholder="07XX XXX XXX" /></Field>
          </div>

          <Button size="lg" className="w-full" onClick={handleDispatch} disabled={dispatching}>
            {dispatching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            Dispatch order
          </Button>
        </div>
      )}

      <div className="flex justify-between mt-8">
        {step > 0 && !dispatching ? (
          <Button variant="ghost" onClick={() => setStep(step - 1)}><ArrowLeft className="w-4 h-4" /> Back</Button>
        ) : <div />}
        {step < 3 && (
          <Button disabled={!canProceed()} onClick={() => setStep(step + 1)}>Continue <ArrowRight className="w-4 h-4" /></Button>
        )}
      </div>
    </div>
  );
}