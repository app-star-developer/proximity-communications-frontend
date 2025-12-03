import { useMemo } from 'react'
import { Link, createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import type { QueryClient } from '@tanstack/react-query'

import { requireAuth } from '../../utils/requireAuth'
import { queryKeys } from '../../api/queryKeys'
import { campaignsApi } from '../../api/modules/campaigns'
import { useEventSummary } from '../../hooks/useAnalytics'
import type { ApiErrorResponse } from '../../api/types'
import { useUIStore } from '../../state/uiStore'

export const Route = createFileRoute('/campaigns/$campaignId')({
  loader: async ({ params, context, location }) => {
    const { queryClient } = context as { queryClient: QueryClient }
    await requireAuth({
      queryClient,
      locationHref: location.href,
    })

    const campaignId = params.campaignId
    if (!campaignId) {
      throw redirect({ to: '/campaigns' })
    }

    try {
      const data = await queryClient.ensureQueryData({
        queryKey: queryKeys.campaign(campaignId),
        queryFn: () => campaignsApi.getById(campaignId),
      })
      return data
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>
      if (axiosError.response?.status === 404) {
        throw redirect({ to: '/campaigns' })
      }
      throw error
    }
  },
  component: CampaignDetailRoute,
})

function CampaignDetailRoute() {
  const campaign = Route.useLoaderData()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { pushToast } = useUIStore()
  const summaryQuery = useEventSummary({ campaignId: campaign.id })
  const statusStyles = getStatusStyles(campaign.status)
  const isCancellable = ['draft', 'scheduled', 'active', 'paused'].includes(
    campaign.status,
  )

  const cancelMutation = useMutation({
    mutationFn: () => campaignsApi.cancel(campaign.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaign(campaign.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns({}) })
      pushToast({
        id: crypto.randomUUID(),
        title: 'Campaign cancelled',
        description: 'The campaign has been marked as cancelled.',
        intent: 'success',
      })
      navigate({ to: '/campaigns' })
    },
    onError: (error) => {
      const axiosError = error as AxiosError<ApiErrorResponse>
      pushToast({
        id: crypto.randomUUID(),
        title: 'Unable to cancel campaign',
        description:
          axiosError.response?.data && 'message' in axiosError.response.data
            ? axiosError.response.data.message
            : 'Please try again or contact support.',
        intent: 'danger',
      })
    },
  })

  const handleCancel = () => {
    const confirmed = window.confirm(
      'Cancel this campaign? Linked venues will no longer trigger notifications.',
    )
    if (!confirmed) {
      return
    }
    cancelMutation.mutate()
  }

  const timeframe = useMemo(() => {
    if (!campaign.startAt && !campaign.endAt) {
      return 'No schedule defined'
    }

    const start = campaign.startAt
      ? format(parseISO(campaign.startAt), 'MMM d, yyyy p')
      : 'Immediately'
    const end = campaign.endAt
      ? format(parseISO(campaign.endAt), 'MMM d, yyyy p')
      : 'Open ended'

    return `${start} → ${end}`
  }, [campaign.endAt, campaign.startAt])

  const summaryStats = useMemo(() => {
    const data = summaryQuery.data?.data ?? []
    const lookup = new Map(data.map((entry) => [entry.eventType, entry.count]))

    const sent = lookup.get('notification_sent') ?? 0
    const opened = lookup.get('notification_opened') ?? 0
    const clicks = lookup.get('click') ?? 0
    const redeems = lookup.get('offer_redeemed') ?? 0

    return {
      sent,
      opened,
      clicks,
      redeems,
      ctr: sent > 0 ? `${((opened / sent) * 100).toFixed(1)}%` : '--',
      cvr: opened > 0 ? `${((clicks / opened) * 100).toFixed(1)}%` : '--',
    }
  }, [summaryQuery.data])

  return (
    <div className="space-y-6">
      <header className="space-y-4 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/30">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Campaign
            </p>
            <h1 className="text-2xl font-semibold text-white">{campaign.name}</h1>
            <p className="mt-1 text-sm text-slate-400">{campaign.description ?? 'No description provided yet.'}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-4 py-1 text-xs font-semibold capitalize ${statusStyles}`}
            >
              {campaign.status}
            </span>
            <Link
              to="/campaigns/$campaignId/edit"
              params={{ campaignId: campaign.id }}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300"
            >
              Edit
            </Link>
          </div>
        </div>
        <dl className="grid gap-4 text-sm text-slate-300 md:grid-cols-4">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Slug</dt>
            <dd className="mt-1 font-medium text-slate-200">{campaign.slug}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">
              Schedule
            </dt>
            <dd className="mt-1 font-medium text-slate-200">{timeframe}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">
              Radius
            </dt>
            <dd className="mt-1 font-medium text-slate-200">
              {campaign.radiusMeters ? `${campaign.radiusMeters} m` : 'Not set'}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">
              Updated
            </dt>
            <dd className="mt-1 font-medium text-slate-200">
              {formatDistanceToNow(parseISO(campaign.updatedAt), {
                addSuffix: true,
              })}
            </dd>
          </div>
        </dl>
      </header>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <article className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/20">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                Engagement snapshot
              </h2>
              <p className="text-xs text-slate-500">
                Aggregated campaign performance (lifetime).
              </p>
            </div>
            {summaryQuery.isFetching ? (
              <span className="text-xs text-slate-500">Refreshing…</span>
            ) : null}
          </header>
          {summaryQuery.isError ? (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-200">
              Unable to load engagement metrics.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-4">
              <Metric title="Notifications" value={summaryStats.sent} />
              <Metric title="Opens" value={summaryStats.opened} />
              <Metric title="Clicks" value={summaryStats.clicks} />
              <Metric title="Redeems" value={summaryStats.redeems} />
            </div>
          )}
          <footer className="mt-6 flex gap-3 text-xs text-slate-400">
            <span>CTR: {summaryStats.ctr}</span>
            <span>CVR: {summaryStats.cvr}</span>
          </footer>
        </article>
        <aside className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/20">
          <h2 className="text-base font-semibold text-white">Actions</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-200">
            <li>
              <Link
                to="/campaigns/$campaignId/edit"
                params={{ campaignId: campaign.id }}
                className="text-cyan-300 hover:underline"
              >
                Edit campaign settings
              </Link>
            </li>
            <li>
              <Link
                to="/campaigns/$campaignId/locations"
                params={{ campaignId: campaign.id }}
                className="text-cyan-300 hover:underline"
              >
                Manage linked venues
              </Link>
            </li>
            {isCancellable ? (
              <li>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={cancelMutation.isPending}
                  className="w-full rounded-lg border border-red-500/50 px-3 py-2 text-left text-red-200 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
                >
                  {cancelMutation.isPending ? 'Cancelling…' : 'Cancel campaign'}
                </button>
              </li>
            ) : null}
          </ul>
        </aside>
      </section>

      <section className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/20">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">
              Linked venues
            </h2>
            <p className="text-xs text-slate-500">
              {campaign.venueIds.length} venues targeted by this promotion.
            </p>
          </div>
          <Link
            to="/campaigns/$campaignId/locations"
            params={{ campaignId: campaign.id }}
            className="text-xs text-cyan-300 hover:underline"
          >
            Adjust venues
          </Link>
        </header>
        {campaign.venueIds.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 px-4 py-6 text-center text-sm text-slate-400">
            No venues have been attached yet. Sync from HappyHour locations or
            import via CSV.
          </div>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {campaign.venueIds.map((venueId) => (
              <li
                key={venueId}
                className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-xs text-slate-300"
              >
                <span className="font-medium text-slate-200">Venue ID:</span>{' '}
                {venueId}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Metric({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-white">
        {value.toLocaleString()}
      </p>
    </div>
  )
}

function getStatusStyles(status: string) {
  switch (status) {
    case 'draft':
      return 'bg-slate-800 text-slate-200'
    case 'scheduled':
      return 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
    case 'active':
      return 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
    case 'paused':
      return 'bg-slate-800 text-slate-300 border border-slate-700'
    case 'completed':
      return 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
    case 'cancelled':
      return 'bg-red-500/20 text-red-200 border border-red-500/40'
    default:
      return 'bg-slate-800 text-slate-200'
  }
}