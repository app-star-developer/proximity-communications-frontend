import { useMemo } from 'react'
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { venuesApi, type VenueListParams } from '../api/modules/venues'
import { queryKeys } from '../api/queryKeys'
import type { UpdateVenueRequest, VenueListResponse } from '../api/types'

export function useVenueList(params: VenueListParams) {
  const filters = useMemo(() => params, [params])

  return useQuery({
    queryKey: queryKeys.venues(filters),
    queryFn: () => venuesApi.list(filters),
    staleTime: 60_000,
  })
}

export function useInfiniteVenues() {
  const limit = 100 // API max limit

  return useInfiniteQuery<VenueListResponse>({
    queryKey: queryKeys.venues({ infinite: true }),
    queryFn: async ({ pageParam = 0 }) => {
      return await venuesApi.list({ limit, offset: pageParam as number })
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.pagination) {
        // If no pagination info, check if we got a full page
        return lastPage.data.length === limit
          ? allPages.length * limit
          : undefined
      }

      const { count, limit: pageLimit, offset: pageOffset } = lastPage.pagination
      const nextOffset = pageOffset + pageLimit

      return nextOffset < count ? nextOffset : undefined
    },
    initialPageParam: 0,
    staleTime: 60_000,
  })
}

export function useVenueOptions(search: string) {
  return useVenueList({ search, limit: 100, offset: 0 })
}

export function useVenue(venueId: string) {
  return useQuery({
    queryKey: queryKeys.venue(venueId),
    queryFn: async () => {
      // Since there's no getById endpoint, we'll need to fetch from list
      // In a real implementation, you'd add a getById endpoint
      // Search through paginated results until we find the venue
      let offset = 0
      const limit = 100 // API max limit
      
      while (true) {
        const response = await venuesApi.list({ limit, offset })
        const venue = response.data.find((v) => v.id === venueId)
        if (venue) return venue
        
        // If we got less than the limit, we've reached the end
        if (response.data.length < limit) break
        
        // Check pagination to see if there are more pages
        if (response.pagination) {
          const { count, limit: pageLimit, offset: pageOffset } = response.pagination
          if (pageOffset + pageLimit >= count) break
          offset += pageLimit
        } else {
          offset += limit
        }
      }
      
      return undefined
    },
    enabled: !!venueId,
  })
}

export function useUpdateVenue() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      venueId,
      payload,
    }: {
      venueId: string
      payload: UpdateVenueRequest
    }) => venuesApi.update(venueId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.venue(variables.venueId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.venues({}) })
    },
  })
}

export function useDeleteVenue() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (venueId: string) => venuesApi.delete(venueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.venues({}) })
    },
  })
}
