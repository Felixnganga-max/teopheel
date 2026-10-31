import { api } from './client';
import { useQuery } from './hooks';

// Resolves data: { from, to, sales: [{ location, orders, refills, fullPurchases, billed, collected }],
//                  outstandingInvoices: [{ _id, count, amount, overdue }], stockTotals: [{ _id, full, empties }] }
// Defaults to today (Nairobi). Location admins only ever see their own shop.
export const getSummary = ({ locationId, from, to } = {}) =>
  api.get('/reports/summary', { locationId, from: from?.toISOString?.() ?? from, to: to?.toISOString?.() ?? to });

export const useSummary = (params = {}, options = { pollMs: 30000 }) =>
  useQuery(() => getSummary(params), [params.locationId, String(params.from), String(params.to)], options);
