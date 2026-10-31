import { api } from './client';
import { useQuery, useMutation } from './hooks';

// filters: { status, paymentStatus, paymentMethod, q (order no. or M-Pesa code), from, to, page, limit, locationId }
export const getOrders = (filters = {}) => api.get('/orders', filters);
// The order detail page. Resolves the order plus:
//   paymentSummary { status, method, amountDue, amountPaid, mpesaReceipt, paidAt, cash, invoice, attempts, needsAttention[] }
//   payments[]  { _id, status, amountRequested, amountPaid, mpesaReceipt, transactionDate, stkPhone, payerPhone, resultCode, resultDesc, source, flags[], initiatedBy, createdAt }
//   messages[]  { _id, type, to, body, status, error, attempts, sentAt, deliveredAt }
//   invoice, cash[], exchange { isExchange, given, returned[] }, stockMovements[], timeline[] { at, type, title, detail }
export const getOrder = (id) => api.get(`/orders/${id}`); // full (unmasked) phone
export const resendPaymentSms = (id, force = false) => api.post(`/orders/${id}/resend-payment-sms`, force ? { force: true } : {});
// A payment confirmed by status query has no M-Pesa code: staff type it in
export const setPaymentReceipt = (paymentId, mpesaReceipt) => api.patch(`/payments/${paymentId}/receipt`, { mpesaReceipt });
// Owner only: what Safaricom actually posted to us. Resolves data: [{ outcome, body, ip, createdAt, ... }]
export const getPaymentCallbacks = (paymentId) => api.get(`/payments/${paymentId}/callback`);
export const getOrderInvoice = (id) => api.get(`/orders/${id}/invoice`);

// Phone entered after dispatch -> backend texts the customer + creates the pay link
export const attachPhone = (id, phone, customerName) => api.patch(`/orders/${id}/phone`, { phone, customerName });
export const resendSms = (id) => api.post(`/orders/${id}/resend-sms`);
export const markDelivered = (id) => api.patch(`/orders/${id}/deliver`); // refill: empty +1
export const cancelOrder = (id, reason) => api.patch(`/orders/${id}/cancel`, { reason }); // restocks the full cylinder
export const queryPayment = (id) => api.post(`/payments/order/${id}/query`); // if the callback never arrived
// Push an M-Pesa prompt to the customer's phone. phone is optional (defaults to the number on the order)
export const sendStk = (id, phone) => api.post(`/payments/order/${id}/stk`, phone ? { phone } : {});

export const useOrders = (filters = {}, options = { pollMs: 10000 }) =>
  useQuery(() => getOrders(filters), [filters.status, filters.paymentStatus, filters.paymentMethod, filters.q, filters.page, filters.limit, filters.locationId, filters.from, filters.to], options);
export const useOrder = (id, options) => useQuery(() => getOrder(id), [id], { enabled: !!id, ...options });

export const useAttachPhone = () => useMutation(({ id, phone, customerName }) => attachPhone(id, phone, customerName));
export const useResendSms = () => useMutation(resendSms);
export const useMarkDelivered = () => useMutation(markDelivered);
export const useCancelOrder = () => useMutation(({ id, reason }) => cancelOrder(id, reason));
export const useQueryPayment = () => useMutation(queryPayment);
export const useSendStk = () => useMutation(({ id, phone }) => sendStk(id, phone));
export const useResendPaymentSms = () => useMutation(({ id, force }) => resendPaymentSms(id, force));
export const useSetPaymentReceipt = () => useMutation(({ paymentId, mpesaReceipt }) => setPaymentReceipt(paymentId, mpesaReceipt));
