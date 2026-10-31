import { api } from './client';
import { useQuery, useMutation } from './hooks';

// Rows: { location, product: {...}, full, empty, low }
export const getStock = (locationId) => api.get('/stock', { locationId });
// The "Empty containers" tab. Resolves { data: rows, totalEmpty }
export const getEmpties = (locationId) => api.get('/stock/empties', { locationId });
export const getMovements = ({ locationId, page, limit } = {}) => api.get('/stock/movements', { locationId, page, limit });

// Rows' product.compatibleWith = ids of swappable cylinders.
// For one product: itself + compatible brands with full/empty at a branch, best-stocked first.
// Resolves data: { requested, alternatives[], inStock[] } each { product, isSelf, full, empty }
export const getSwapOptions = ({ productId, locationId }) => api.get('/stock/swap-options', { productId, locationId });
// Brand swaps over a period. Resolves data: { swaps: [{ given, returned, cylinders, orders }], netEmptiesByBrand: [{ brand, balance }] }
export const getExchangeReport = ({ locationId, from, to } = {}) => api.get('/reports/exchanges', { locationId, from, to });

// Distributor drop-off: { productId, fullReceived, emptiesReturned, note?, locationId? (owner) }
export const receiveStock = (payload) => api.post('/stock/receive', payload);
// Owner-only correction: { locationId, productId, full (+/-), empty (+/-), note }
export const adjustStock = (payload) => api.post('/stock/adjust', payload);

export const useStock = (locationId, options) => useQuery(() => getStock(locationId), [locationId], options);
export const useEmpties = (locationId, options) => useQuery(() => getEmpties(locationId), [locationId], options);
export const useMovements = (params = {}, options) => useQuery(() => getMovements(params), [params.locationId, params.page, params.limit], options);
export const useReceiveStock = () => useMutation(receiveStock);
export const useAdjustStock = () => useMutation(adjustStock);
export const useSwapOptions = (params, options) => useQuery(() => getSwapOptions(params), [params.productId, params.locationId], options);
export const useExchangeReport = (params = {}, options) => useQuery(() => getExchangeReport(params), [params.locationId, String(params.from), String(params.to)], options);
