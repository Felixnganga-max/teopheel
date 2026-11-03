// frontend/src/pages/Dashboard.jsx
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ShoppingBag, FileText, Recycle, BarChart3, ChevronRight } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import { Spinner, ErrorBox } from '../components/ui/Feedback';
import { useSummary, useOrders, useLocations } from '../api';
import { formatCurrency, ORDER_STATUS_VARIANT, PAYMENT_STATUS } from '../lib/format';

const PERIODS = { daily: 'Today', weekly: 'Last 7 days', monthly: 'Last 30 days' };

function periodStart(period) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (period === 'weekly') d.setDate(d.getDate() - 6);
  if (period === 'monthly') d.setDate(d.getDate() - 29);
  return d;
}

export default function Dashboard() {
  const [period, setPeriod] = useState('daily');
  const from = useMemo(() => periodStart(period), [period]);

  const { data, loading, error, refetch } = useSummary({ from });
  const { data: locations } = useLocations();
  const { data: recent } = useOrders({ limit: 5 }, { pollMs: 15000 });

  const sales = data?.sales || [];
  const totals = sales.reduce(
    (a, s) => ({ billed: a.billed + s.billed, collected: a.collected + s.collected, orders: a.orders + s.orders }),
    { billed: 0, collected: 0, orders: 0 }
  );
  const owed = (data?.outstandingInvoices || []).reduce((a, r) => ({ amount: a.amount + r.amount, count: a.count + r.count, overdue: a.overdue + r.overdue }), { amount: 0, count: 0, overdue: 0 });
  const empties = (data?.stockTotals || []).reduce((n, r) => n + r.empties, 0);
  const maxBilled = Math.max(1, ...sales.map((s) => s.billed));
  const nameOf = (id) => locations?.find((l) => l._id === id)?.name || 'Branch';

  return (
    <div className="p-4 sm:p-8 space-y-8">
      <div className="flex bg-white rounded-lg p-1 border border-gray-100 w-fit">
        {Object.entries(PERIODS).map(([k, label]) => (
          <button key={k} onClick={() => setPeriod(k)}
            className={`px-3 sm:px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${period === k ? 'bg-accent text-shell shadow-sm' : 'text-steel hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading && !data && <Spinner />}
      <ErrorBox error={error} onRetry={refetch} />

      {data && (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5">
            <StatCard title="Billed" value={formatCurrency(totals.billed)} icon={DollarSign} subtitle={`${formatCurrency(totals.collected)} collected`} />
            <StatCard title="Orders" value={totals.orders} icon={ShoppingBag} subtitle="Excludes cancelled" />
            <StatCard title="Unpaid invoices" value={formatCurrency(owed.amount)} icon={FileText} subtitle={`${owed.count} open · ${owed.overdue} overdue`} />
            <StatCard title="Empty containers" value={empties} icon={Recycle} subtitle="Across all branches" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-accent" />
                <h3 className="font-semibold text-gray-900 whitespace-nowrap">Branch performance</h3>
                <span className="ml-auto text-xs text-steel-light hidden sm:inline">Tap a branch for details</span>
              </div>
              {sales.length === 0 && <p className="text-sm text-steel py-6 text-center">No orders in this period</p>}
              <div className="space-y-3">
                {sales.map((s) => (
                  <Link key={s._id} to={`/branches/${s._id}`} className="block rounded-2xl border border-gray-100 p-4 hover:border-accent/50 hover:bg-card/60 active:bg-card transition-colors">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-semibold text-gray-900 truncate">{s.location || nameOf(s._id)}</span>
                      <span className="flex items-center gap-1 text-steel font-medium shrink-0 tabular-nums">{formatCurrency(s.billed)}<ChevronRight className="w-4 h-4 text-steel-light" /></span>
                    </div>
                    <div className="mt-3 h-3 bg-card-dark rounded-full overflow-hidden relative">
                      <div className="absolute h-full rounded-full bg-accent/30" style={{ width: `${(s.billed / maxBilled) * 100}%` }} />
                      <div className="absolute h-full rounded-full bg-accent transition-all duration-700" style={{ width: `${(s.collected / maxBilled) * 100}%` }} />
                    </div>
                    <div className="mt-2 flex justify-between gap-2 text-xs text-steel-light">
                      <span>{s.orders} orders · {s.refills} refills · {s.fullPurchases} whole</span>
                      <span className="shrink-0">{formatCurrency(s.collected)} collected</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-5">Stock by branch</h3>
              <div className="space-y-4">
                {(data.stockTotals || []).map((r) => (
                  <Link key={r._id} to={`/branches/${r._id}`} className="flex items-center justify-between gap-2 py-3 border-b border-gray-50 last:border-0 hover:bg-card/60 -mx-2 px-2 rounded-lg">
                    <p className="text-sm font-medium text-gray-800 truncate">{nameOf(r._id)}</p>
                    <div className="text-right text-xs text-steel-light flex-shrink-0 flex items-center gap-1">
                      <span><span className="text-sm font-semibold text-gray-900 tabular-nums">{r.full}</span> full · <span className="text-sm font-semibold text-gray-900 tabular-nums">{r.empties}</span> empty</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-5 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Recent orders</h3></div>
        <ul className="md:hidden divide-y divide-gray-50">
          {recent?.map((o) => (
            <li key={o._id}>
              <Link to={`/orders/${o._id}`} className="flex items-center gap-3 px-4 py-4 active:bg-card">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 truncate">{o.orderNumber} <span className="font-normal text-steel">· {o.customerName || 'Walk-in'}</span></p>
                  <p className="text-xs text-steel mt-0.5 truncate">{o.location?.name} · {o.productSnapshot?.name} × {o.quantity}</p>
                  <div className="mt-2 flex gap-1.5 flex-wrap">
                    <Badge variant={ORDER_STATUS_VARIANT[o.status]}>{o.status}</Badge>
                    <Badge variant={PAYMENT_STATUS[o.paymentStatus]?.variant}>{PAYMENT_STATUS[o.paymentStatus]?.label}</Badge>
                  </div>
                </div>
                <span className="font-bold tabular-nums text-gray-900">{formatCurrency(o.amount)}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="text-left text-xs font-semibold text-steel uppercase tracking-wider">
                {['Order', 'Customer', 'Branch', 'Product', 'Amount', 'Status'].map((h) => <th key={h} className="px-6 py-3">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recent?.map((o) => (
                <tr key={o._id} className="hover:bg-card/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{o.orderNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{o.customerName || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{o.location?.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{o.productSnapshot?.name} × {o.quantity}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatCurrency(o.amount)}</td>
                  <td className="px-6 py-4 flex gap-1.5 flex-wrap">
                    <Badge variant={ORDER_STATUS_VARIANT[o.status]}>{o.status}</Badge>
                    <Badge variant={PAYMENT_STATUS[o.paymentStatus]?.variant}>{PAYMENT_STATUS[o.paymentStatus]?.label}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {recent?.length === 0 && <p className="text-sm text-steel text-center py-8">No orders yet</p>}
      </div>
    </div>
  );
}
