import { api } from './client';
import { useQuery, useMutation } from './hooks';

// params: { status: 'failed'|'sent'|'delivered'|'queued'|'undelivered', type, orderId, page, limit, locationId }
// Resolves { data: rows, total, failedCount }; rows: { _id, type, to, body, status, error, attempts, sentAt, orderNumber, order }
export const getMessages = (params = {}) => api.get('/messages', params);
export const retryMessage = (id) => api.post(`/messages/${id}/retry`);
export const syncMessage = (id) => api.post(`/messages/${id}/sync`); // asks Celcom for the delivery report
export const retryFailedMessages = (limit = 50) => api.post('/messages/retry-failed', { limit }); // owner
export const getSmsBalance = () => api.get('/messages/balance'); // owner: { configured, credit? }
export const sendTestSms = (phone, message) => api.post('/messages/test', { phone, ...(message && { message }) }); // owner

export const useMessages = (params = {}, options) =>
  useQuery(() => getMessages(params), [params.status, params.type, params.orderId, params.page, params.limit, params.locationId], options);
export const useSmsBalance = (options) => useQuery(getSmsBalance, [], options);
export const useRetryMessage = () => useMutation(retryMessage);
export const useSyncMessage = () => useMutation(syncMessage);
export const useRetryFailedMessages = () => useMutation(retryFailedMessages);
export const useSendTestSms = () => useMutation(({ phone, message }) => sendTestSms(phone, message));
