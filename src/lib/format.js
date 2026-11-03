export const formatCurrency = (n) => `KES ${Number(n || 0).toLocaleString('en-KE')}`;

export function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatTimeAgo(iso) {
  if (!iso) return '—';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return formatTime(iso);
}

export const ORDER_STATUS_VARIANT = { dispatched: 'info', delivered: 'success', cancelled: 'danger' };

export const PAYMENT_STATUS = {
  unpaid: { label: 'Unpaid', variant: 'warning' },
  pending: { label: 'Awaiting M-Pesa', variant: 'info' },
  paid: { label: 'Paid', variant: 'success' },
  invoiced: { label: 'Invoiced', variant: 'accent' },
};

export const MOVEMENT_LABEL = {
  dispatch: 'Dispatched',
  empty_collected: 'Empty collected',
  cancel_restock: 'Restocked',
  receive: 'Received',
  adjust: 'Adjustment',
  refill_out: 'Sent for refill',
  refill_in: 'Back from refill',
};

// The three states a cylinder can be in at a branch. Colours pass the palette check; every use also shows a number and a name.
export const STOCK_COLOR = { full: '#2A8F6E', empty: '#C9A84C', atRefill: '#3B6FB6' };

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export const PAYMENT_METHOD = { mpesa: 'M-Pesa', cash: 'Cash', invoice: 'Invoice' };

export const MESSAGE_STATUS = {
  queued: { label: 'Sending', variant: 'info' },
  sent: { label: 'Sent', variant: 'success' },
  delivered: { label: 'Delivered', variant: 'success' },
  undelivered: { label: 'Not delivered', variant: 'danger' },
  failed: { label: 'Failed', variant: 'danger' },
};

export const MESSAGE_TYPE = { order_dispatch: 'Order SMS', payment_received: 'Payment thank-you', manual: 'Test SMS' };

export const MPESA_STATUS = {
  pending: { label: 'Waiting for customer', variant: 'info' },
  success: { label: 'Received', variant: 'success' },
  failed: { label: 'Failed', variant: 'danger' },
  cancelled: { label: 'Cancelled by customer', variant: 'warning' },
  mismatch: { label: 'Wrong amount', variant: 'danger' },
};

// What each payment flag means, and what to do about it
export const PAYMENT_FLAGS = {
  underpaid: { label: 'Underpaid', help: 'The customer sent less than the order total. The order stays unpaid. Collect the balance or refund.' },
  overpaid: { label: 'Overpaid', help: 'The customer sent more than the order total. Refund the difference.' },
  duplicate_payment: { label: 'Paid twice', help: 'This order was already paid (cash or another M-Pesa payment). Refund this payment.' },
  order_cancelled: { label: 'Paid after cancelling', help: 'Money arrived for a cancelled order. Refund it.' },
  receipt_missing: { label: 'M-Pesa code missing', help: 'Safaricom confirmed the payment but no code came through. Enter it from the customer’s M-Pesa SMS or your statement.' },
  duplicate_receipt: { label: 'Duplicate code', help: 'Safaricom re-sent a code already recorded on another payment.' },
};

export const TIMELINE_DOT = { created: 'bg-steel-light', sms: 'bg-info', payment: 'bg-success', invoice: 'bg-accent', delivered: 'bg-success', cancelled: 'bg-danger' };
