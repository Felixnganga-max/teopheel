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

// Receive cylinders. Several brands at once:
//   { items: [{ productId, fullReceived, emptiesReceived }], note?, locationId? (owner) }
// (a single { productId, fullReceived, emptiesReceived } still works)
export const receiveStock = (payload) => api.post('/stock/receive', payload);

// ---- Refill trip. Nobody types a number: Reset moves every empty at the branch to "at the refill station",
// Refill brings those same cylinders back as full stock.
// Resolves data: [{ location, name, emptyNow, byProduct: [{ product, quantity }], run: null | { total, items[], startedAt }, lastCompleted }]
export const getRefillStatus = (locationId) => api.get('/refill', { locationId });
export const resetEmpties = (locationId) => api.post('/refill/reset', locationId ? { locationId } : {});
export const completeRefill = (locationId) => api.post('/refill/complete', locationId ? { locationId } : {});
// Owner-only correction: { locationId, productId, full (+/-), empty (+/-), note }
export const adjustStock = (payload) => api.post('/stock/adjust', payload);

export const useStock = (locationId, options) => useQuery(() => getStock(locationId), [locationId], options);
export const useEmpties = (locationId, options) => useQuery(() => getEmpties(locationId), [locationId], options);
export const useMovements = (params = {}, options) => useQuery(() => getMovements(params), [params.locationId, params.page, params.limit], options);
export const useReceiveStock = () => useMutation(receiveStock);
export const useAdjustStock = () => useMutation(adjustStock);
export const useSwapOptions = (params, options) => useQuery(() => getSwapOptions(params), [params.productId, params.locationId], options);
export const useExchangeReport = (params = {}, options) => useQuery(() => getExchangeReport(params), [params.locationId, String(params.from), String(params.to)], options);
export const useRefillStatus = (locationId, options) => useQuery(() => getRefillStatus(locationId), [locationId], options);
export const useResetEmpties = () => useMutation(resetEmpties);
export const useCompleteRefill = () => useMutation(completeRefill);
