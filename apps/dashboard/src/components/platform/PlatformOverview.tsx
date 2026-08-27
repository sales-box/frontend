import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertCircle,
  BookOpen,
  Building2,
  CheckCircle2,
  CreditCard,
  Mail,
  PauseCircle,
  Sparkles,
  Users,
} from "lucide-react";
import type { PlatformStats, SubscriptionStatus } from "../../platform-client";
import { usePlatformStats } from "../../hooks/platformQueries";
import { metric, statsView } from "../../lib/platformStats";
import { useChartColors } from "../../hooks/useChartColors";
import { friendlyError } from "../../lib/platformFormat";
import { Card } from "../Card";
import { StatCard } from "../StatCard";

/**
 * Subscription state in the operator's words.
 *
 * Kept separate from plan tier on purpose: every tenant has a tier, including
 * the ones who have never paid a cent, so a tier breakdown read as revenue
 * counts customers who are not customers.
 */
const BILLING: {
  key: SubscriptionStatus;
  label: string;
  hint: string;
  className: string;
  swatch: string;
}[] = [
  {
    key: "active",
    label: "Paying",
    hint: "Subscription in good standing",
    className: "text-success",
    swatch: "var(--color-success)",
  },
  {
    key: "past_due",
    label: "Payment failed",
    hint: "Was paying; a charge bounced",
    className: "text-warning",
    swatch: "var(--color-warning)",
  },
  {
    key: "canceled",
    label: "Canceled",
    hint: "Refunded, charged back or ended",
    className: "text-danger",
    swatch: "var(--color-danger)",
  },
  {
    key: "none",
    label: "Never paid",
    hint: "Signed up, never subscribed",
    className: "text-text-tertiary",
    swatch: "var(--color-text-tertiary)",
  },
];

/** "2026-08-27" → "27 Aug". Parsed as UTC, which is how the server bucketed it. */
function dayLabel(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function PlatformOverview() {
  const stats = usePlatformStats();
  // Every section is optional at runtime: this page and the API deploy
  // separately, so a build of it will sometimes run against an older server.
  // statsView turns anything missing into null, which renders as "—".
  const v = statsView(stats.isError ? undefined : stats.data);

  return (
    <>
      {stats.isError && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-md border border-danger/30 bg-danger-light px-3 py-2.5 text-[13px] text-danger"
        >
          <AlertCircle
            size={15}
            strokeWidth={1.5}
            className="mt-0.5 flex-shrink-0"
          />
          <span>
            Couldn&apos;t load platform totals — {friendlyError(stats.error)}
          </span>
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total tenants"
          value={metric(v.total)}
          icon={<Building2 size={16} strokeWidth={1.5} />}
          tone="blue"
          size="sm"
        />
        <StatCard
          label="Active"
          value={metric(v.active)}
          icon={<CheckCircle2 size={16} strokeWidth={1.5} />}
          tone="green"
          size="sm"
        />
        <StatCard
          label="Suspended"
          value={metric(v.suspended)}
          icon={<PauseCircle size={16} strokeWidth={1.5} />}
          tone="amber"
          size="sm"
        />
        <StatCard
          label="New this week"
          value={metric(v.newThisWeek)}
          icon={<Sparkles size={16} strokeWidth={1.5} />}
          tone="blue"
          size="sm"
        />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Paying tenants"
          value={metric(v.paying)}
          icon={<CreditCard size={16} strokeWidth={1.5} />}
          tone="green"
          size="sm"
        />
        <StatCard
          label="Sales engineers"
          value={metric(v.seats)}
          icon={<Users size={16} strokeWidth={1.5} />}
          tone="blue"
          size="sm"
        />
        <StatCard
          label="Documents"
          value={metric(v.documents)}
          icon={<BookOpen size={16} strokeWidth={1.5} />}
          tone="blue"
          size="sm"
        />
        <StatCard
          label="Emails analysed"
          value={metric(v.emailsAnalysed)}
          icon={<Mail size={16} strokeWidth={1.5} />}
          tone="amber"
          size="sm"
        />
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col p-5 lg:col-span-2">
          <h2 className="text-subheading text-text-primary">Last 30 days</h2>
          <p className="text-body mt-1 text-text-secondary">
            Signups and analysed email volume across every workspace, by day.
          </p>
          {stats.isPending ? (
            <div
              className="mt-4 min-h-[170px] flex-1 animate-pulse rounded-lg bg-surface-tertiary"
              aria-hidden="true"
            />
          ) : v.trend ? (
            <div className="mt-4 grid min-h-[170px] flex-1 gap-6 md:grid-cols-2">
              <TrendPanel
                title="Signups"
                total={v.trend.reduce((n, p) => n + p.signups, 0)}
                data={v.trend}
                dataKey="signups"
                kind="bar"
                name="Signups"
              />
              <TrendPanel
                title="Emails analysed"
                total={v.trend.reduce((n, p) => n + p.emailsAnalysed, 0)}
                data={v.trend}
                dataKey="emailsAnalysed"
                kind="area"
                name="Emails"
              />
            </div>
          ) : (
            <Unavailable what="Daily figures" />
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-subheading text-text-primary">Subscriptions</h2>
          <p className="text-body mt-1 text-text-secondary">
            Who is actually paying — not the same as the plan tier they sit on.
          </p>
          <BillingBreakdown
            billing={v.billing}
            loading={stats.isPending}
          />
        </Card>
      </div>
    </>
  );
}

function TrendPanel({
  title,
  total,
  data,
  dataKey,
  kind,
  name,
}: {
  title: string;
  total: number;
  data: PlatformStats["trend"];
  dataKey: "signups" | "emailsAnalysed";
  kind: "bar" | "area";
  name: string;
}) {
  const c = useChartColors();
  const stroke = kind === "bar" ? c.secondary : c.primary;
  const axisTick = { fill: c.tick, fontSize: 11 };
  const tooltipStyle = {
    background: c.surface,
    border: `1px solid ${c.border}`,
    borderRadius: 8,
    color: c.text,
    fontSize: 12,
  };

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[13px] font-medium text-text-primary">{title}</h3>
        <span className="text-caption text-text-tertiary">
          {total.toLocaleString()} total
        </span>
      </div>
      <div className="mt-2 min-h-[140px] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          {kind === "bar" ? (
            <BarChart data={data} margin={{ top: 4, right: 14, bottom: 0, left: 0 }}>
              <XAxis
                dataKey="date"
                tick={axisTick}
                axisLine={false}
                tickLine={false}
                // 30 labels do not fit; every seventh keeps a weekly rhythm.
                interval={6}
                tickFormatter={dayLabel}
              />
              <YAxis
                tick={axisTick}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={32}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: c.border, fillOpacity: 0.3 }}
                labelFormatter={(label) => dayLabel(String(label))}
              />
              <Bar
                dataKey={dataKey}
                name={name}
                fill={stroke}
                radius={[3, 3, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          ) : (
            <AreaChart data={data} margin={{ top: 4, right: 14, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={axisTick}
                axisLine={false}
                tickLine={false}
                interval={6}
                tickFormatter={dayLabel}
              />
              <YAxis
                tick={axisTick}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={32}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ stroke: c.border }}
                labelFormatter={(label) => dayLabel(String(label))}
              />
              <Area
                type="monotone"
                dataKey={dataKey}
                name={name}
                stroke={stroke}
                strokeWidth={2}
                fill="url(#trendFill)"
                isAnimationActive={false}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Says a figure is missing without dressing it up as a zero. */
function Unavailable({ what }: { what: string }) {
  return (
    <p className="text-body mt-4 text-text-tertiary">
      {what} aren&apos;t available from the server right now.
    </p>
  );
}

function BillingBreakdown({
  billing,
  loading,
}: {
  billing: PlatformStats["billing"] | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div
        className="mt-4 h-40 animate-pulse rounded-lg bg-surface-tertiary"
        aria-hidden="true"
      />
    );
  }
  if (!billing) return <Unavailable what="Subscription figures" />;

  const total = BILLING.reduce((n, b) => n + billing[b.key], 0);

  return (
    <div className="mt-4">
      {total > 0 && (
        <div
          className="flex h-2 overflow-hidden rounded-full bg-surface-tertiary"
          role="img"
          aria-label={BILLING.map((b) => `${billing[b.key]} ${b.label}`).join(", ")}
        >
          {BILLING.map((b) =>
            billing[b.key] > 0 ? (
              <div
                key={b.key}
                style={{
                  width: `${(billing[b.key] / total) * 100}%`,
                  background: b.swatch,
                }}
              />
            ) : null,
          )}
        </div>
      )}
      <dl className="mt-4 space-y-3">
        {BILLING.map((b) => (
          <div key={b.key} className="flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <dt className="text-[13px] font-medium text-text-primary">
                <span
                  aria-hidden="true"
                  className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
                  style={{ background: b.swatch }}
                />
                {b.label}
              </dt>
              <p className="text-caption ml-4 text-text-tertiary">{b.hint}</p>
            </div>
            <dd className={`text-lg font-semibold tabular-nums ${b.className}`}>
              {billing[b.key].toLocaleString()}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
