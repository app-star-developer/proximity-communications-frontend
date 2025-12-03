import { api } from '../client'
import type {
  CreateVenueRequest,
  UpdateVenueRequest,
  VenueListResponse,
  Venue,
  VenuePlacesSyncRequest,
  VenueIngestionResult,
  VenuePlacesPreviewResponse,
  VenueManualImportRequest,
  VenuePrimaryType,
} from '../types'

export interface VenueListParams {
  search?: string
  limit?: number
  offset?: number
  primaryType?: VenuePrimaryType | VenuePrimaryType[]
  isShared?: boolean
  city?: string
  region?: string
  countryCode?: string
}

export const venuesApi = {
  async list(params: VenueListParams = {}) {
    const response = await api.get<VenueListResponse>('/venues', {
      params,
    })
    return response.data
  },

  async create(payload: CreateVenueRequest) {
    const response = await api.post<Venue>('/venues', payload)
    return response.data
  },

  async update(venueId: string, payload: UpdateVenueRequest) {
    const response = await api.put<Venue>(`/venues/${venueId}`, payload)
    return response.data
  },

  async delete(venueId: string) {
    await api.delete(`/venues/${venueId}`)
  },

  async placesSync(payload: VenuePlacesSyncRequest) {
    const response = await api.post<VenueIngestionResult>(
      '/venues/places-sync',
      payload,
    )
    return response.data
  },

  async placesPreview(params: {
    textQuery: string
    latitude?: number
    longitude?: number
    radiusMeters?: number
    pageSize?: number
  }) {
    const response = await api.get<VenuePlacesPreviewResponse>(
      '/venues/places-preview',
      {
        params,
      },
    )
    return response.data
  },

  async manualImport(payload: VenueManualImportRequest) {
    const response = await api.post<VenueIngestionResult>(
      '/venues/manual-import',
      payload,
    )
    return response.data
  },
}
