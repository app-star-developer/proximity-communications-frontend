import { api } from '../client'
import type {
  EventSummaryResponse,
  EventTimeseriesResponse,
  EventIngestRequest,
  EventIngestResponse,
} from '../types'

export interface EventSummaryParams {
  startAt?: string
  endAt?: string
  eventType?: string
  campaignId?: string
  venueId?: string
  granularity?: 'day' | 'hour'
}

export const eventsApi = {
  async getSummary(params: EventSummaryParams = {}) {
    const response = await api.get<EventSummaryResponse>(
      '/events/analytics/summary',
      { params },
    )
    return response.data
  },

  async getTimeseries(params: EventSummaryParams = {}) {
    const response = await api.get<EventTimeseriesResponse>(
      '/events/analytics/timeseries',
      { params },
    )
    return response.data
  },

  async recordEvents(payload: EventIngestRequest) {
    const response = await api.post<EventIngestResponse>('/events', payload)
    return response.data
  },
}

