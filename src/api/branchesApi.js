import { api } from './client';
import { useQuery } from './hooks';

// One call for the whole branch page. period: 'daily' | 'weekly' | 'monthly'
// Resolves data: { location, sales, money: { collected, byMethod, owed }, trend[7 days], stock[], totals, refill, recentOrders[], recentMovements[] }
export const getBranchOverview = (id, period = 'daily') => api.get(`/branches/${id}/overview`, { period });
export const useBranchOverview = (id, period, options = { pollMs: 30000 }) => useQuery(() => getBranchOverview(id, period), [id, period], options);
