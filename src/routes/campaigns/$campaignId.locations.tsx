import { useId, useMemo, useState, useEffect } from 'react'
import {
  Link,
  createFileRoute,
  redirect,
} from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import type { QueryClient } from '@tanstack/react-query'

import { requireAuth } from '../../utils/requireAuth'
import { queryKeys } from '../../api/queryKeys'
import { campaignsApi } from '../../api/modules/campaigns'
import type { ApiErrorResponse } from '../../api/types'
import { useCampaignDetail } from '../../hooks/useCampaigns'
import { useUIStore } from '../../state/uiStore'
import { useInfiniteVenues } from '../../hooks/useVenues'
import { VenueCard } from '../../components/VenueCard'
import { VenueSelector } from '../../components/VenueSelector'

export const Route = createFileRoute('/campaigns/$campaignId/locations')({
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
  component: CampaignLocationsRoute,
})

function CampaignLocationsRoute() {
  const loaderData = Route.useLoaderData()
  const campaignQuery = useCampaignDetail(loaderData.id)
  const queryClient = useQueryClient()
  const { pushToast } = useUIStore()

  const campaign = campaignQuery.data ?? loaderData
  const [pendingIds, setPendingIds] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showVenueSelector, setShowVenueSelector] = useState(false)

  const textareaId = useId()
  const checkboxIdPrefix = useMemo(() => crypto.randomUUID(), [])


  // Fetch venue details for attached venues using infinite scrolling
  const attachedVenueIds = campaign.venueIds
  const venuesQuery = useInfiniteVenues()
  
  // Flatten all pages into a single array
  const venues = useMemo(() => {
    return venuesQuery.data?.pages.flatMap((page) => page.data) ?? []
  }, [venuesQuery.data])

  const attachedVenues = useMemo(() => {
    return venues.filter((v) => attachedVenueIds.includes(v.id))
  }, [venues, attachedVenueIds])

  // Auto-fetch next pages if we haven't found all attached venues yet
  const foundAttachedCount = attachedVenues.length
  const missingAttachedCount = attachedVenueIds.length - foundAttachedCount
  const hasMorePages = venuesQuery.hasNextPage
  const isLoadingMore = venuesQuery.isFetchingNextPage

  // Auto-load more if we're missing attached venues and there are more pages
  useEffect(() => {
    if (
      missingAttachedCount > 0 &&
      hasMorePages &&
      !isLoadingMore &&
      !venuesQuery.isLoading &&
      venuesQuery.isSuccess
    ) {
      venuesQuery.fetchNextPage()
    }
  }, [missingAttachedCount, hasMorePages, isLoadingMore, venuesQuery.isLoading, venuesQuery.isSuccess, venuesQuery.fetchNextPage])


  const mutation = useMutation({
    mutationFn: (venueIds: string[]) =>
      campaignsApi.update(campaign.id, { venueIds }),
    onMutate: async (newVenueIds) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.campaign(campaign.id) })

      // Snapshot the previous value for rollback
      const previousCampaign = queryClient.getQueryData(queryKeys.campaign(campaign.id))

      // Optimistically update the campaign cache
      queryClient.setQueryData(queryKeys.campaign(campaign.id), (old: typeof campaign) => {
        if (!old) return old
        return { ...old, venueIds: newVenueIds }
      })

      // Return context with the previous value for rollback
      return { previousCampaign }
    },
    onError: (error, _newVenueIds, context) => {
      // Rollback to the previous value on error
      if (context?.previousCampaign) {
        queryClient.setQueryData(queryKeys.campaign(campaign.id), context.previousCampaign)
      }

      const axiosError = error as AxiosError<ApiErrorResponse>
      const message =
        axiosError.response?.data && 'message' in axiosError.response.data
          ? axiosError.response.data.message
          : 'Failed to update venues. Try again.'
      pushToast({
        id: crypto.randomUUID(),
        title: 'Update failed',
        description: message,
        intent: 'danger',
      })
    },
    onSuccess: (updated) => {
      // Update with the real response from the server
      queryClient.setQueryData(queryKeys.campaign(campaign.id), updated)
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns({}) })
      // Invalidate all venue queries to refresh the list
      queryClient.invalidateQueries({ queryKey: queryKeys.venues({}) })
      pushToast({
        id: crypto.randomUUID(),
        title: 'Venues updated',
        description: `${updated.venueIds.length} venues linked.`,
        intent: 'success',
      })
      setPendingIds('')
      setSelectedIds([])
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.campaign(campaign.id) })
    },
  })

  const parsedPending = parseCsv(pendingIds)

  const handleAttach = () => {
    if (!parsedPending.length) {
      pushToast({
        id: crypto.randomUUID(),
        title: 'No venue IDs provided',
        description: 'Add one or more venue identifiers to attach.',
        intent: 'warning',
      })
      return
    }

    const merged = Array.from(new Set([...attachedVenueIds, ...parsedPending]))
    mutation.mutate(merged)
  }

  const handleVenueSelectorChange = (venueIds: string[]) => {
    // venueIds is the complete new selection from VenueSelector
    // It includes all checked venues (both previously attached and newly selected)
    // So we use it directly as the new attached venues list
    mutation.mutate(venueIds, {
      onSuccess: () => {
        setShowVenueSelector(false)
      },
    })
  }

  const handleDetach = () => {
    if (!selectedIds.length) {
      pushToast({
        id: crypto.randomUUID(),
        title: 'Select venues',
        description: 'Choose at least one venue to detach.',
        intent: 'warning',
      })
      return
    }

    const remaining = attachedVenueIds.filter((id: string) => !selectedIds.includes(id))
    mutation.mutate(remaining)
  }

  const handleSelect = (venueId: string, checked: boolean) => {
    setSelectedIds((previous) => {
      if (checked) {
        return [...previous, venueId]
      }
      return previous.filter((id) => id !== venueId)
    })
  }

  const isUpdating = mutation.isPending

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/30 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Venues</p>
          <h1 className="text-2xl font-semibold text-white">
            Manage linked locations
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Attach HappyHour venues or detach inactive locations for {campaign.name}.
          </p>
        </div>
        <Link
          to="/campaigns/$campaignId"
          params={{ campaignId: campaign.id }}
          className="text-sm text-slate-400 hover:text-slate-200"
        >
          Back to campaign
        </Link>
      </header>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <article className="space-y-4 rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/20">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                Attached venues ({attachedVenueIds.length})
              </h2>
              <p className="text-xs text-slate-500">
                Select venues to detach or review their details.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDetach}
              disabled={isUpdating || selectedIds.length === 0}
              className="rounded-lg border border-red-500/50 px-3 py-1.5 text-xs text-red-200 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
            >
              Detach selected
            </button>
          </header>
          {attachedVenueIds.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-4 py-8 text-center text-sm text-slate-400">
              No venues linked yet. Use the venue selector or attach IDs manually.
            </div>
          ) : venuesQuery.isLoading && venues.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-4 py-8 text-center text-sm text-slate-400">
              Loading venue details...
            </div>
          ) : venuesQuery.isError ? (
            <div className="rounded-xl border border-dashed border-red-700/50 bg-red-900/20 px-4 py-8 text-center text-sm text-red-400">
              Failed to load venues. Please refresh the page.
            </div>
          ) : attachedVenues.length > 0 ? (
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {attachedVenues.map((venue) => {
                const checkboxId = `${checkboxIdPrefix}-${venue.id}`
                const checked = selectedIds.includes(venue.id)
                return (
                  <li key={venue.id}>
                    <div
                      className={`rounded-xl border px-4 py-3 transition ${
                        checked
                          ? 'border-cyan-500/40 bg-cyan-500/10'
                          : 'border-slate-800 bg-slate-950/50'
                      }`}
                    >
                      <label htmlFor={checkboxId} className="flex items-start gap-2">
                        <input
                          id={checkboxId}
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => handleSelect(venue.id, event.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border border-slate-600 bg-slate-900 text-cyan-500 focus:ring-cyan-500/40"
                        />
                        <div className="flex-1">
                          <VenueCard venue={venue} />
                        </div>
                      </label>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : isLoadingMore ? (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-4 py-8 text-center text-sm text-slate-400">
              Loading more venues to find attached venues...
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-yellow-700/50 bg-yellow-900/20 px-4 py-8 text-center text-sm text-yellow-400">
              <p>
                {attachedVenueIds.length} venue(s) linked but not found in the venues list.
              </p>
              {hasMorePages && (
                <button
                  type="button"
                  onClick={() => venuesQuery.fetchNextPage()}
                  disabled={isLoadingMore}
                  className="mt-3 rounded-lg border border-yellow-600/50 bg-yellow-900/20 px-4 py-2 text-xs text-yellow-300 transition hover:bg-yellow-900/30 disabled:opacity-50"
                >
                  {isLoadingMore ? 'Loading...' : 'Load more venues'}
                </button>
              )}
              <p className="mt-2 text-xs">
                They may have been deleted or belong to a different organization.
              </p>
            </div>
          )}
          {isLoadingMore && attachedVenues.length > 0 && (
            <div className="mt-4 text-center text-xs text-slate-500">
              Loading more venues...
            </div>
          )}
        </article>

        <aside className="space-y-4 rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/20">
          <h2 className="text-base font-semibold text-white">Attach venues</h2>
          {!showVenueSelector ? (
            <>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowVenueSelector(true)}
                  className="w-full rounded-lg border border-cyan-500/60 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
                >
                  Search and select venues
                </button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-700"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-950 px-2 text-slate-500">Or</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Paste comma-separated venue IDs from HappyHour or Google Places ingestion results. Duplicates are ignored automatically.
              </p>
              <textarea
                id={textareaId}
                value={pendingIds}
                onChange={(event) => setPendingIds(event.target.value)}
                rows={6}
                placeholder="venue-id-1, venue-id-2"
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              />
              <button
                type="button"
                onClick={handleAttach}
                disabled={isUpdating}
                className="w-full rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:cursor-not-allowed disabled:bg-cyan-500/50"
              >
                {isUpdating ? 'Updating…' : 'Attach venues'}
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowVenueSelector(false)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                ← Back to manual entry
              </button>
              <VenueSelector
                selectedVenueIds={attachedVenueIds}
                onSelectionChange={handleVenueSelectorChange}
              />
            </div>
          )}
        </aside>
      </section>
    </div>
  )
}

function parseCsv(raw: string) {
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
}
