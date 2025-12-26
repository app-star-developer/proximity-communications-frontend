import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { addDays, subDays } from 'date-fns'

import { useEventSummary } from '../../hooks/useAnalytics'

const RANGE_OPTIONS = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 14 days', value: 14 },
  { label: 'Last 30 days', value: 30 },
] as const

const EVENT_TYPES = [
  { key: 'notification_sent', label: 'Notifications sent' },
  { key: 'notification_opened', label: 'Notifications opened' },
  { key: 'click', label: 'Clicks' },
  { key: 'offer_viewed', label: 'Offer views' },
  { key: 'offer_redeemed', label: 'Offer redeems' },
] as const

type AudienceDatum = {
  eventType: string
  label: string
  count: number
  share: number
}

export const Route = createFileRoute('/dashboard/audience')({
  component: AudienceInsightsRoute,
})

function AudienceInsightsRoute() {
  const [range, setRange] = useState<(typeof RANGE_OPTIONS)[number]>(RANGE_OPTIONS[0])
  const [activeEvents, setActiveEvents] = useState<string[]>(() =>
    EVENT_TYPES.map((item) => item.key),
  )

  const { startAt, endAt } = useMemo(() => {
    const end = new Date()
    const start = subDays(end, range.value)
    return {
      startAt: start.toISOString(),
      endAt: addDays(end, 1).toISOString(),
    }
  }, [range.value])

  const summaryQuery = useEventSummary({ startAt, endAt })

  const audienceData: AudienceDatum[] = useMemo(() => {
    const raw = summaryQuery.data?.data ?? []
    const selected = raw.filter((item) => activeEvents.includes(item.eventType))
    const total = selected.reduce((sum, item) => sum + item.count, 0)

    return selected.map((item) => {
      const label = EVENT_TYPES.find((entry) => entry.key === item.eventType)?.label ??
        item.eventType
      return {
        eventType: item.eventType,
        label,
        count: item.count,
        share: total > 0 ? Number(((item.count / total) * 100).toFixed(1)) : 0,
      }
    })
  }, [activeEvents, summaryQuery.data])

  const totalInteractions = audienceData.reduce((sum, item) => sum + item.count, 0)

  const toggleEventType = (eventType: string) => {
    setActiveEvents((previous) =>
      previous.includes(eventType)
        ? previous.filter((key) => key !== eventType)
        : [...previous, eventType],
    )
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/30">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Audience analytics
            </p>
            <h1 className="text-2xl font-semibold text-white">
              Engagement by outcome
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Review how proximity notifications are performing and refine targeting strategies.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-slate-500">
              Range
            </span>
            <select
              value={range.value}
              onChange={(event) => {
                const next = RANGE_OPTIONS.find(
                  (option) => option.value === Number(event.target.value),
                )
                if (next) {
                  setRange(next)
                }
              }}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            >
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/20">
        <header className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Event filters</h2>
            <p className="text-xs text-slate-500">
              Toggle the outcomes you want to compare. Totals update immediately.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveEvents(EVENT_TYPES.map((item) => item.key))}
            className="text-xs text-cyan-300 hover:underline"
          >
            Reset
          </button>
        </header>
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map((item) => {
            const active = activeEvents.includes(item.key)
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => toggleEventType(item.key)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  active
                    ? 'bg-cyan-500 text-slate-950 shadow shadow-cyan-500/40'
                    : 'border border-slate-700 bg-slate-900 text-slate-300 hover:border-cyan-500 hover:text-cyan-200'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <article className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/20">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                Interaction mix
              </h2>
              <p className="text-xs text-slate-500">
                Comparable volume across selected event types.
              </p>
            </div>
            {summaryQuery.isFetching ? (
              <span className="text-xs text-slate-500">Refreshing…</span>
            ) : null}
          </header>
          {summaryQuery.isError ? (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-200">
              Unable to load event data. Try adjusting the range.
            </div>
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer>
                <BarChart data={audienceData}>
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(45,212,191,0.1)' }}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: '1px solid rgba(148,163,184,0.2)',
                      color: '#e2e8f0',
                    }}
                    formatter={(value: number, name: string, payload) => [
                      value.toLocaleString(),
                      payload?.payload?.label ?? name,
                    ]}
                  />
                  <Bar
                    dataKey="count"
                    fill="#2dd4bf"
                    radius={[6, 6, 0, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>
        <aside className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/20">
          <header className="mb-4">
            <h2 className="text-base font-semibold text-white">Summary</h2>
            <p className="text-xs text-slate-500">
              Total interactions across selected events.
            </p>
          </header>
          <div className="space-y-3 text-sm text-slate-300">
            <p>
              <span className="text-slate-500">Interactions:</span>{" "}
              <span className="font-semibold text-white">
                {summaryQuery.isLoading ? '...' : totalInteractions.toLocaleString()}
              </span>
            </p>
            <ul className="space-y-3">
              {audienceData.map((item) => (
                <li
                  key={item.eventType}
                  className="rounded-xl border border-slate-800/70 bg-slate-950/50 px-4 py-3"
                >
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {item.count.toLocaleString()}
                    <span className="ml-2 text-xs text-slate-400">{item.share}%</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>
    </div>
  )
}
