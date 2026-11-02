import { api } from './client';
import { useQuery, useMutation } from './hooks';

// Individuals are created automatically when an order has a phone. Create corporates here (invoice customers).
// { type: 'corporate', name, companyName, kraPin?, email?, address?, phone, whatsapp?, creditTermsDays? }
export const createCustomer = (payload) => api.post('/customers', payload);
// params: { type, q (name / company / full phone), page, limit }  -> phones are shown in full
export const getCustomers = (params = {}) => api.get('/customers', params);
export const getCustomer = (id) => api.get(`/customers/${id}`);
export const updateCustomer = (id, payload) => api.patch(`/customers/${id}`, payload);

export const useCustomers = (params = {}, options) =>
  useQuery(() => getCustomers(params), [params.type, params.q, params.page, params.limit], options);
export const useCustomer = (id, options) => useQuery(() => getCustomer(id), [id], { enabled: !!id, ...options });
export const useCreateCustomer = () => useMutation(createCustomer);
export const useUpdateCustomer = () => useMutation(({ id, ...payload }) => updateCustomer(id, payload));
