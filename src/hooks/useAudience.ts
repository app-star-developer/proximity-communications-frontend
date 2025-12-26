import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { audienceApi, type AudienceDevicesParams, type AudienceGrowthParams } from '../api/modules/audience'
import { queryKeys } from '../api/queryKeys'

export function useAudienceMetrics() {
  return useQuery({
    queryKey: queryKeys.audienceMetrics(),
    queryFn: () => audienceApi.getMetrics(),
    staleTime: 60_000, // 1 minute
  })
}

export function useAudienceGrowth(params?: AudienceGrowthParams) {
  const filters = useMemo(() => params, [params])

  return useQuery({
    queryKey: queryKeys.audienceGrowth(filters),
    queryFn: () => audienceApi.getGrowth(filters),
    staleTime: 60_000,
  })
}

export function useAudienceDevices(params?: AudienceDevicesParams) {
  const filters = useMemo(() => params, [params])

  return useQuery({
    queryKey: queryKeys.audienceDevices(filters),
    queryFn: () => audienceApi.getDevices(filters),
    staleTime: 30_000, // 30 seconds for device lists
  })
}

export function useAudienceDeviceDetails(deviceId: string) {
  return useQuery({
    queryKey: queryKeys.audienceDevice(deviceId),
    queryFn: () => audienceApi.getDeviceDetails(deviceId),
    enabled: !!deviceId,
    staleTime: 30_000,
  })
}

export function useAudienceSegmentation() {
  return useQuery({
    queryKey: queryKeys.audienceSegmentation(),
    queryFn: () => audienceApi.getSegmentation(),
    staleTime: 60_000,
  })
}

