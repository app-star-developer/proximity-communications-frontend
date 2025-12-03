import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { venuesApi, type VenueListParams } from '../api/modules/venues'
import { queryKeys } from '../api/queryKeys'
import type { UpdateVenueRequest } from '../api/types'

export function useVenueList(params: VenueListParams) {
  const filters = useMemo(() => params, [params])

  return useQuery({
    queryKey: queryKeys.venues(filters),
    queryFn: () => venuesApi.list(filters),
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
      const list = await venuesApi.list({ limit: 1000 })
      return list.data.find((v) => v.id === venueId)
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
