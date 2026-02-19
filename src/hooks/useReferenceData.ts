import { useQuery } from '@tanstack/react-query'
import { locationsApi } from '../api/modules/locations'
import { venuesApi } from '../api/modules/venues'
import { api } from '../api/client'
import type { PromoType } from '../api/types'

export const REF_QueryKeys = {
  countries: ['countries'] as const,
  states: (countryId: string) => ['states', countryId] as const,
  lgas: (stateId: string) => ['lgas', stateId] as const,
  venueTypes: ['venue-types'] as const,
  promoTypes: ['promo-types'] as const,
}

export function useCountries() {
  return useQuery({
    queryKey: REF_QueryKeys.countries,
    queryFn: locationsApi.getCountries,
    staleTime: Infinity,
  })
}

export function useStates(countryId: string | undefined) {
  return useQuery({
    queryKey: REF_QueryKeys.states(countryId ?? ''),
    queryFn: () => locationsApi.getStates(countryId!),
    enabled: !!countryId,
    staleTime: Infinity,
  })
}

export function useLgas(stateId: string | undefined) {
  return useQuery({
    queryKey: REF_QueryKeys.lgas(stateId ?? ''),
    queryFn: () => locationsApi.getLgas(stateId!),
    enabled: !!stateId,
    staleTime: Infinity,
  })
}

export function useVenueTypes() {
  return useQuery({
    queryKey: REF_QueryKeys.venueTypes,
    queryFn: venuesApi.getVenueTypes,
    staleTime: Infinity,
  })
}

export function usePromoTypes() {
  return useQuery({
    queryKey: REF_QueryKeys.promoTypes,
    queryFn: async () => {
      const response = await api.get<{ data: PromoType[] }>('/promo-types')
      return response.data.data
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}
