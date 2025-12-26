import { api } from '../client'
import type {
  VenueOwnerListResponse,
  VenueOwner,
  CreateVenueOwnerRequest,
  ResendPasswordResponse,
  RetryOwnerCreationResponse,
} from '../types'

export const venueOwnersApi = {
  async list(venueId: string) {
    const response = await api.get<VenueOwnerListResponse>(
      `/venues/${venueId}/owners`,
    )
    return response.data
  },

  async getById(venueId: string, ownerId: string) {
    const response = await api.get<VenueOwner>(
      `/venues/${venueId}/owners/${ownerId}`,
    )
    return response.data
  },

  async create(venueId: string, payload: CreateVenueOwnerRequest) {
    const response = await api.post<VenueOwner>(
      `/venues/${venueId}/owners`,
      payload,
    )
    return response.data
  },

  async delete(venueId: string, ownerId: string) {
    await api.delete(`/venues/${venueId}/owners/${ownerId}`)
  },

  async resendPassword(venueId: string, ownerId: string) {
    const response = await api.post<ResendPasswordResponse>(
      `/venues/${venueId}/owners/${ownerId}/resend-password`,
    )
    return response.data
  },

  async retryFailedCreations(venueOwnerId?: string) {
    const params = venueOwnerId ? { venueOwnerId } : {}
    const response = await api.post<RetryOwnerCreationResponse>(
      '/venue-owners/retry',
      undefined,
      { params },
    )
    return response.data
  },
}

