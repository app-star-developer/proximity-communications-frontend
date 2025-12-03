import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '../api/queryKeys'
import { eventsApi } from '../api/modules/events'
import type { EventSummaryParams } from '../api/modules/events'

export function useEventSummary(filters: EventSummaryParams) {
  const params = useMemo(() => filters, [filters])

  return useQuery({
    queryKey: queryKeys.eventSummary(params),
    queryFn: () => eventsApi.getSummary(params),
    refetchOnMount: false,
  })
}

export function useEventTimeseries(filters: EventSummaryParams) {
  const params = useMemo(() => filters, [filters])

  return useQuery({
    queryKey: queryKeys.eventTimeseries(params),
    queryFn: () => eventsApi.getTimeseries(params),
    refetchOnMount: false,
  })
}

