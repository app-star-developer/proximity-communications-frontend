import { useId, useMemo, useState } from 'react'
import {
  Link,
  createFileRoute,
  useNavigate,
} from '@tanstack/react-router'
import { format, parseISO } from 'date-fns'

import { useCampaignList } from '../../hooks/useCampaigns'
import type { Campaign } from '../../api/types'

const STATUS_OPTIONS = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Draft', value: 'draft' },
  { label: 'Paused', value: 'paused' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
] as const

const SKELETON_KEYS = [
  'skeleton-one',
  'skeleton-two',
  'skeleton-three',
  'skeleton-four',
  'skeleton-five',
  'skeleton-six',
] as const

interface CampaignSearch {
  status?: Campaign['status'] | 'all'
  page?: number
}

export const Route = createFileRoute('/campaigns/')({
  component: CampaignsRoute,
  validateSearch: (search: Record<string, unknown>): CampaignSearch => {
    const status =
      typeof search.status === 'string' ? search.status.toLowerCase() : undefined
    const page =
      typeof search.page === 'string'
        ? Number.parseInt(search.page, 10)
        : typeof search.page === 'number'
          ? search.page
          : undefined

    return {
      status:
        status && STATUS_OPTIONS.some((option) => option.value === status)
          ? (status as CampaignSearch['status'])
          : 'all',
      page: Number.isFinite(page) && page && page > 0 ? page : 1,
    }
  },
})

const PAGE_SIZE = 10

function CampaignsRoute() {
  const navigate = useNavigate()
  const search = Route.useSearch()
  const [searchTerm, setSearchTerm] = useState('')
  const statusSelectId = useId()

  const filters = useMemo(
    () => ({
      status: search.status && search.status !== 'all' ? search.status : undefined,
      limit: PAGE_SIZE,
      offset: ((search.page ?? 1) - 1) * PAGE_SIZE,
    }),
    [search.page, search.status],
  )

  const campaignQuery = useCampaignList(filters)

  const filteredCampaigns =
    campaignQuery.data?.data.filter((campaign) => {
      if (!searchTerm.trim()) {
        return true
      }
      const term = searchTerm.toLowerCase()
      return (
        campaign.name.toLowerCase().includes(term) ||
        campaign.slug.toLowerCase().includes(term) ||
        (campaign.description ?? '').toLowerCase().includes(term)
      )
    }) ?? []

  const handleStatusChange = (status: string) => {
    navigate({
      to: Route.fullPath,
      search: {
        status: status as CampaignSearch['status'],
        page: 1,
      },
    })
  }

  const handlePaginate = (direction: 'next' | 'prev') => {
    const currentPage = search.page ?? 1
    const nextPage = direction === 'next' ? currentPage + 1 : Math.max(1, currentPage - 1)
    navigate({
      to: Route.fullPath,
      search: {
        status: search.status ?? 'all',
        page: nextPage,
      },
    })
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/30 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Campaigns</h2>
          <p className="mt-1 text-sm text-slate-400">
            Monitor proximity promotions, schedules, and performance at a glance.
          </p>
        </div>
        <Link
          to="/campaigns/new"
          className="inline-flex items-center justify-center rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
        >
          New campaign
        </Link>
      </header>
      <section className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/20">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <label
              htmlFor={statusSelectId}
              className="text-xs uppercase tracking-wide text-slate-500"
            >
              Status
            </label>
            <select
              id={statusSelectId}
              value={search.status ?? 'all'}
              onChange={(event) => handleStatusChange(event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-1 items-center gap-2 md:justify-end">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search campaigns…"
              className="w-full max-w-xs rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30"
            />
          </div>
        </div>
        <div className="mt-6">
          {campaignQuery.isLoading ? (
            <CampaignSkeleton />
          ) : filteredCampaigns.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </div>
        <footer className="mt-6 flex items-center justify-between border-t border-slate-800/70 pt-4 text-xs text-slate-500">
          <span>
            Page {search.page ?? 1}
            {campaignQuery.isFetching ? ' · Updating…' : null}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePaginate('prev')}
              disabled={(search.page ?? 1) === 1 || campaignQuery.isFetching}
              className="rounded-lg border border-slate-700 px-3 py-1 text-slate-300 transition hover:border-cyan-500 hover:text-cyan-300 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => handlePaginate('next')}
              disabled={
                campaignQuery.isFetching ||
                (campaignQuery.data?.data.length ?? 0) < PAGE_SIZE
              }
              className="rounded-lg border border-slate-700 px-3 py-1 text-slate-300 transition hover:border-cyan-500 hover:text-cyan-300 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
            >
              Next
            </button>
          </div>
        </footer>
      </section>
    </div>
  )
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const statusStyles: Record<Campaign['status'], string> = {
    draft: 'bg-slate-800 text-slate-200',
    scheduled: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    active: 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40',
    paused: 'bg-slate-800 text-slate-300 border border-slate-700',
    completed: 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40',
    cancelled: 'bg-red-500/20 text-red-200 border border-red-500/40',
  }

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-slate-950/30 transition hover:border-cyan-500/40 hover:shadow-xl">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">{campaign.name}</h3>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {campaign.slug}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusStyles[campaign.status]}`}
        >
          {campaign.status}
        </span>
      </header>
      {campaign.description ? (
        <p className="line-clamp-3 text-sm text-slate-300">
          {campaign.description}
        </p>
      ) : (
        <p className="text-sm text-slate-500 italic">
          No campaign description provided.
        </p>
      )}
      <dl className="grid grid-cols-2 gap-3 text-xs text-slate-400">
        <div>
          <dt className="font-medium text-slate-500">Start</dt>
          <dd className="mt-1 text-slate-200">
            {campaign.startAt ? format(parseISO(campaign.startAt), 'MMM d, yyyy') : '—'}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">End</dt>
          <dd className="mt-1 text-slate-200">
            {campaign.endAt ? format(parseISO(campaign.endAt), 'MMM d, yyyy') : '—'}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Radius</dt>
          <dd className="mt-1 text-slate-200">
            {campaign.radiusMeters ? `${campaign.radiusMeters} m` : 'Not set'}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Venues</dt>
          <dd className="mt-1 text-slate-200">
            {campaign.venueIds.length}
          </dd>
        </div>
      </dl>
      <footer className="mt-auto flex items-center justify-between pt-2 text-xs text-cyan-300">
        <Link
          to="/campaigns/$campaignId"
          params={{ campaignId: campaign.id }}
          className="hover:underline"
        >
          View details →
        </Link>
        <Link
          to="/campaigns/$campaignId/edit"
          params={{ campaignId: campaign.id }}
          className="hover:underline text-slate-400"
        >
          Edit
        </Link>
      </footer>
    </article>
  )
}

function CampaignSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {SKELETON_KEYS.map((key) => (
        <div
          key={key}
          className="h-48 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/50"
        />
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-10 text-center text-sm text-slate-400">
      <p className="text-base font-semibold text-white">
        No campaigns match your filters
      </p>
      <p className="max-w-md">
        Adjust the status or search term, or create a new campaign to kick off a
        proximity promotion across lounges, bars, and cafes.
      </p>
      <Link
        to="/campaigns/new"
        className="rounded-lg border border-cyan-500/60 px-4 py-2 text-sm text-cyan-200 transition hover:bg-cyan-500/10"
      >
        Create campaign
      </Link>
    </div>
  )
}

