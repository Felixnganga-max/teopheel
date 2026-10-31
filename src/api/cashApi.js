import { api } from './client';
import { useQuery, useMutation } from './hooks';

// Record that a customer paid cash for an order. The amount is always the order total.
// payload: { handedBy?: 'Rider name', note?: string }
export const recordCash = (orderId, payload = {}) => api.post(`/cash/order/${orderId}`, payload);

// params: { status: 'recorded'|'voided', from, to, page, limit, locationId (owner) }
// Resolves { data: rows, summary: { amount, count }, byDay: [{ _id: '2026-10-24', amount, count }], total }
export const getCashCollections = ({ from, to, ...rest } = {}) =>
  api.get('/cash', { ...rest, from: from?.toISOString?.() ?? from, to: to?.toISOString?.() ?? to });

export const voidCash = (id, reason) => api.patch(`/cash/${id}/void`, { reason }); // owner

export const useCashCollections = (params = {}, options) =>
  useQuery(() => getCashCollections(params), [params.status, String(params.from), String(params.to), params.page, params.limit, params.locationId], options);
export const useRecordCash = () => useMutation(({ orderId, ...payload }) => recordCash(orderId, payload));
export const useVoidCash = () => useMutation(({ id, reason }) => voidCash(id, reason));