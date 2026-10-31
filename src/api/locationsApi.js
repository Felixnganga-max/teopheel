import { api } from './client';
import { useQuery, useMutation } from './hooks';

// Owner only. Creating a location also creates its admin.
export const getLocations = () => api.get('/locations'); // each includes admins[]
export const getLocation = (id) => api.get(`/locations/${id}`);
// { name, address, contactPhone?, serviceAreas: ['kikuyu','kinoo'], admin: { name, email, password } }
export const createLocation = (payload) => api.post('/locations', payload);
// { name?, address?, contactPhone?, serviceAreas?, active? }
export const updateLocation = (id, payload) => api.patch(`/locations/${id}`, payload);
export const resetAdminPassword = (locationId, adminId, newPassword) =>
  api.post(`/locations/${locationId}/admins/${adminId}/reset-password`, { newPassword });

export const useLocations = (options) => useQuery(getLocations, [], options);
export const useLocation = (id, options) => useQuery(() => getLocation(id), [id], { enabled: !!id, ...options });
export const useCreateLocation = () => useMutation(createLocation);
export const useUpdateLocation = () => useMutation(({ id, ...payload }) => updateLocation(id, payload));
export const useResetAdminPassword = () => useMutation(({ locationId, adminId, newPassword }) => resetAdminPassword(locationId, adminId, newPassword));
