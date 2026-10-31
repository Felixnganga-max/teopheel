import { api } from './client';
import { useQuery, useMutation } from './hooks';

// params: { status: 'unpaid'|'paid'|'void', customerId, page, limit, locationId }; rows carry `overdue`
export const getInvoices = (params = {}) => api.get('/invoices', params);
export const getInvoice = (id) => api.get(`/invoices/${id}`);

// Resolves data: { number, pdfUrl, whatsappLink }. Optional override number (07.. or 254..)
export const shareInvoice = (id, whatsapp) => api.post(`/invoices/${id}/share`, whatsapp ? { whatsapp } : {});
export const markInvoicePaid = (id, paymentRef) => api.patch(`/invoices/${id}/pay`, { paymentRef });
export const voidInvoice = (id) => api.patch(`/invoices/${id}/void`); // owner

// Authenticated PDF -> opens in a new tab
export async function openInvoicePdf(id) {
  const blob = await api.blob(`/invoices/${id}/pdf`);
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// Open WhatsApp with the invoice message prefilled
export const openWhatsApp = (whatsappLink) => window.open(whatsappLink, '_blank', 'noopener');

export const useInvoices = (params = {}, options) =>
  useQuery(() => getInvoices(params), [params.status, params.customerId, params.page, params.limit, params.locationId], options);
export const useInvoice = (id, options) => useQuery(() => getInvoice(id), [id], { enabled: !!id, ...options });
export const useShareInvoice = () => useMutation(({ id, whatsapp }) => shareInvoice(id, whatsapp));
export const useMarkInvoicePaid = () => useMutation(({ id, paymentRef }) => markInvoicePaid(id, paymentRef));
export const useVoidInvoice = () => useMutation(voidInvoice);
