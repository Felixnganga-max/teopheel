// frontend/src/pages/BranchDetail.jsx  (phone first)
// One branch in detail: money collected, full / empty / at-station cylinders, the refill trip, latest orders and stock moves.
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Phone, MapPin, ChevronRight, Package } from 'lucide-react';
import RefillCard from '../components/inventory/RefillCard';
import Badge from '../components/ui/Badge';
import { Spinner, ErrorBox } from '../components/ui/Feedback';
import { useBranchOverview } from '../api';
import { formatCurrency, formatTimeAgo, ORDER_STATUS_VARIANT, PAYMENT_STATUS, MOVEMENT_LABEL, STOCK_COLOR } from '../lib/format';

const PERIODS = { daily: 'Today', weekly: '7 days', monthly: '30 days' };
const METHOD = { mpesa: { label: 'M-Pesa', color: '#2A8F6E' }, cash: { label: 'Cash', color: '#C9A84C' }, invoice: { label: 'Invoice', color: '#3B6FB6' } };
const day = (key, opts) => new Date(`${key}T12:00:00`).toLocaleDateString('en-GB', opts);

function Section({ title, children, aside }) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between px-1">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

// Money collected per day. Tap or focus a bar to read the exact amount.
function WeekBars({ days }) {
  const [picked, setPicked] = useState(days.length - 1);
  const max = Math.max(1, ...days.map((d) => d.amount));
  const sel = days[Math.min(picked, days.length - 1)];
  const H = 96;
  return (
    <div>
      <p className="text-sm text-white/70 min-h-5">
        <span className="text-white font-semibold tabular-nums">{formatCurrency(sel.amount)}</span> on {day(sel.date, { weekday: 'long', day: 'numeric', month: 'short' })}
      </p>
      <div className="mt-3 flex items-end gap-2" style={{ height: H }} role="group" aria-label="Money collected per day, last 7 days">
        {days.map((d, i) => {
          const h = Math.max(d.amount ? 6 : 3, Math.round((d.amount / max) * H));
          const on = i === picked;
          return (
            <button key={d.date} type="button" onClick={() => setPicked(i)} onFocus={() => setPicked(i)} aria-label={`${day(d.date, { weekday: 'long' })}: ${formatCurrency(d.amount)}`}
              className="flex-1 h-full flex items-end cursor-pointer group focus:outline-none">
              <span className="w-full rounded-t-md rounded-b-[2px] transition-all group-focus-visible:ring-2 ring-white" style={{ height: h, background: on ? '#E3C46B' : 'rgba(255,255,255,0.22)' }} />
            </button>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-2">
        {days.map((d, i) => <span key={d.date} className={`flex-1 text-center text-[11px] ${i === picked ? 'text-white font-semibold' : 'text-white/50'}`}>{day(d.date, { weekday: 'short' }).slice(0, 3)}</span>)}
      </div>
    </div>
  );
}

function StackBar({ parts }) {
  const total = parts.reduce((n, p) => n + p.value, 0);
  if (!total) return <div className="h-3 rounded-full bg-card-dark" />;
  return (
    <div className="flex h-3 rounded-full overflow-hidden gap-0.5" role="img" aria-label={parts.map((p) => `${p.label} ${p.value}`).join(', ')}>
      {parts.filter((p) => p.value > 0).map((p) => <span key={p.label} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} />)}
    </div>
  );
}

export default function BranchDetail() {
  const { id } = useParams();
  const [period, setPeriod] = useState('daily');
  const { data: d, loading, error, refetch } = useBranchOverview(id, period);

  if (loading && !d) return <div className="p-4"><Spinner /></div>;
  if (error && !d) return <div className="p-4 space-y-4"><Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-steel"><ArrowLeft className="w-4 h-4" /> Back</Link><ErrorBox error={error} onRetry={refetch} /></div>;
  if (!d) return null;

  const { location, sales, money, trend, stock, totals, refill } = d;
  const paidParts = Object.entries(METHOD).map(([k, m]) => ({ label: m.label, color: m.color, value: money.byMethod[k]?.amount || 0, count: money.byMethod[k]?.count || 0 }));

  return (
    <div className="pb-24 md:pb-10">
      {/* Hero */}
      <div className="bg-shell text-white px-4 sm:px-8 pt-4 pb-6 rounded-b-[28px] md:rounded-none">
        <div className="max-w-5xl mx-auto">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white h-10"><ArrowLeft className="w-4 h-4" /> Dashboard</Link>
          <div className="mt-1 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">{location.name}</h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-white/60"><MapPin className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{location.address}</span></p>
            </div>
            {location.contactPhone && (
              <a href={`tel:${location.contactPhone}`} aria-label={`Call ${location.name}`} className="shrink-0 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"><Phone className="w-5 h-5" /></a>
            )}
          </div>

          <div className="mt-5 grid grid-cols-3 bg-white/10 rounded-xl p-1">
            {Object.entries(PERIODS).map(([k, label]) => (
              <button key={k} onClick={() => setPeriod(k)} className={`h-10 rounded-lg text-sm font-semibold transition cursor-pointer ${period === k ? 'bg-accent text-shell' : 'text-white/70'}`}>{label}</button>
            ))}
          </div>

          <p className="mt-6 text-sm text-white/70">Money collected</p>
          <p className="text-5xl sm:text-6xl font-bold tabular-nums tracking-tight" style={{ color: '#E3C46B' }}>{formatCurrency(money.collected)}</p>
          <p className="mt-1 text-sm text-white/60">{sales.orders} orders · {formatCurrency(sales.billed)} billed</p>

          <div className="mt-6"><WeekBars days={trend} /></div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 mt-6 space-y-8">
        {/* Money */}
        <Section title="Money">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-sm text-steel">Still to collect</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{formatCurrency(money.owed.amount)}</p>
              <p className="text-xs text-steel-light mt-0.5">{money.owed.count} unpaid order{money.owed.count === 1 ? '' : 's'}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-sm text-steel">Average order</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{formatCurrency(sales.average)}</p>
              <p className="text-xs text-steel-light mt-0.5">{sales.refills} refills · {sales.wholes} whole</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
            <p className="text-sm font-medium text-gray-900">How it was paid</p>
            <StackBar parts={paidParts} />
            <ul className="space-y-2.5">
              {paidParts.map((p) => (
                <li key={p.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-steel"><span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />{p.label}<span className="text-xs text-steel-light">{p.count} payment{p.count === 1 ? '' : 's'}</span></span>
                  <span className="font-semibold tabular-nums text-gray-900">{formatCurrency(p.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        </Section>

        {/* Stock */}
        <Section title="Cylinders">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[['Full', totals.full, STOCK_COLOR.full], ['Empty', totals.empty, STOCK_COLOR.empty], ['At station', totals.atRefill, STOCK_COLOR.atRefill]].map(([label, n, color]) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4">
                <p className="flex items-center gap-1.5 text-xs sm:text-sm text-steel"><span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />{label}</p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-gray-900">{n}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {stock.length === 0 && <p className="p-5 text-sm text-steel text-center">No stock recorded yet. Use Receive stock on the Inventory page.</p>}
            {stock.map((r) => (
              <div key={r.product._id} className="p-4 space-y-2.5">
                <div className="flex items-center gap-3">
                  {r.product.image?.url ? <img src={r.product.image.url} alt="" className="w-9 h-9 rounded-lg object-contain bg-card" /> : <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center"><Package className="w-4 h-4 text-accent" /></div>}
                  <span className="flex-1 font-medium text-gray-900">{r.product.name}</span>
                  {r.full === 0 ? <Badge variant="danger">Out</Badge> : r.low ? <Badge variant="warning">Low</Badge> : null}
                </div>
                <StackBar parts={[{ label: 'Full', value: r.full, color: STOCK_COLOR.full }, { label: 'Empty', value: r.empty, color: STOCK_COLOR.empty }, { label: 'At station', value: r.atRefill, color: STOCK_COLOR.atRefill }]} />
                <p className="text-xs text-steel tabular-nums"><strong className="text-gray-900">{r.full}</strong> full · <strong className="text-gray-900">{r.empty}</strong> empty{r.atRefill > 0 && <> · <strong className="text-gray-900">{r.atRefill}</strong> at station</>}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Refill trip */}
        <Section title="Refill trip">
          <RefillCard state={refill} name="" locationId={location._id} onChanged={refetch} />
        </Section>

        {/* Orders */}
        <Section title="Latest orders" aside={<Link to="/orders" className="text-sm font-medium text-accent-hover">All orders</Link>}>
          <ul className="space-y-2">
            {d.recentOrders.length === 0 && <li className="bg-white rounded-2xl border border-gray-100 p-5 text-sm text-steel text-center">No orders yet</li>}
            {d.recentOrders.map((o) => (
              <li key={o._id}>
                <Link to={`/orders/${o._id}`} className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 active:bg-card">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate">{o.orderNumber} <span className="font-normal text-steel">· {o.customerName || 'Walk-in'}</span></p>
                    <p className="text-xs text-steel mt-0.5 truncate">{o.productSnapshot?.name} × {o.quantity} · {formatTimeAgo(o.createdAt)}</p>
                    <div className="mt-2 flex gap-1.5 flex-wrap">
                      <Badge variant={ORDER_STATUS_VARIANT[o.status]}>{o.status}</Badge>
                      <Badge variant={PAYMENT_STATUS[o.paymentStatus]?.variant}>{PAYMENT_STATUS[o.paymentStatus]?.label}</Badge>
                    </div>
                  </div>
                  <span className="font-bold tabular-nums text-gray-900">{formatCurrency(o.amount)}</span>
                  <ChevronRight className="w-4 h-4 text-steel-light shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        {/* Stock moves */}
        <Section title="Latest stock activity">
          <ul className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {d.recentMovements.length === 0 && <li className="p-5 text-sm text-steel text-center">Nothing yet</li>}
            {d.recentMovements.map((m) => (
              <li key={m._id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{MOVEMENT_LABEL[m.type] || m.type} · {m.product?.name}</p>
                  <p className="text-xs text-steel-light mt-0.5">{formatTimeAgo(m.createdAt)}{m.user?.name ? ` · ${m.user.name}` : ''}</p>
                </div>
                <div className="text-right text-sm font-semibold tabular-nums shrink-0">
                  {m.fullDelta !== 0 && <p className={m.fullDelta > 0 ? 'text-success' : 'text-danger'}>{m.fullDelta > 0 ? '+' : ''}{m.fullDelta} full</p>}
                  {m.emptyDelta !== 0 && <p className={m.emptyDelta > 0 ? 'text-success' : 'text-danger'}>{m.emptyDelta > 0 ? '+' : ''}{m.emptyDelta} empty</p>}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
