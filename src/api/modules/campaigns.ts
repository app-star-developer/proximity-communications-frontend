import { api } from '../client'
import type {
  Campaign,
  CampaignListResponse,
  MessageResponse,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CampaignNotificationConfig,
  CampaignNotificationConfigResponse,
  CreateCampaignNotificationConfigRequest,
  UpdateCampaignNotificationConfigRequest,
} from '../types'

export interface CampaignListParams {
  status?: string
  limit?: number
  offset?: number
}

export type CreateCampaignPayload = CreateCampaignRequest
export type UpdateCampaignPayload = UpdateCampaignRequest

export const campaignsApi = {
  async list(params: CampaignListParams = {}) {
    const response = await api.get<CampaignListResponse>('/campaigns', {
      params,
    })
    return response.data
  },

  async getById(campaignId: string) {
    const response = await api.get<Campaign>(`/campaigns/${campaignId}`)
    return response.data
  },

  async create(payload: CreateCampaignPayload) {
    const response = await api.post<Campaign>('/campaigns', payload)
    return response.data
  },

  async update(campaignId: string, payload: UpdateCampaignPayload) {
    const response = await api.put<Campaign>(
      `/campaigns/${campaignId}`,
      payload,
    )
    return response.data
  },

  async cancel(campaignId: string) {
    await api.delete<MessageResponse | undefined>(`/campaigns/${campaignId}`)
  },

  // Campaign Notification Configuration
  async getNotificationConfig(campaignId: string) {
    const response = await api.get<CampaignNotificationConfigResponse>(
      `/campaigns/${campaignId}/notifications`,
    )
    return response.data
  },

  // Upsert default notification config (creates if doesn't exist, updates if it does)
  async upsertNotificationConfig(
    campaignId: string,
    payload: CreateCampaignNotificationConfigRequest,
  ) {
    const response = await api.post<CampaignNotificationConfig>(
      `/campaigns/${campaignId}/notifications`,
      payload,
    )
    return response.data
  },

  async createNotificationConfig(
    campaignId: string,
    payload: CreateCampaignNotificationConfigRequest,
  ) {
    const response = await api.post<CampaignNotificationConfig>(
      `/campaigns/${campaignId}/notifications`,
      payload,
    )
    return response.data
  },

  async updateNotificationConfig(
    campaignId: string,
    notificationId: string,
    payload: UpdateCampaignNotificationConfigRequest,
  ) {
    const response = await api.put<CampaignNotificationConfig>(
      `/campaigns/${campaignId}/notifications/${notificationId}`,
      payload,
    )
    return response.data
  },

  async deleteNotificationConfig(
    campaignId: string,
    notificationId: string,
  ) {
    await api.delete<MessageResponse | undefined>(
      `/campaigns/${campaignId}/notifications/${notificationId}`,
    )
  },

  // Per-venue notification overrides (future)
  async createVenueNotificationOverride(
    campaignId: string,
    venueId: string,
    payload: CreateCampaignNotificationConfigRequest,
  ) {
    const response = await api.post<CampaignNotificationConfig>(
      `/campaigns/${campaignId}/notifications/venues/${venueId}`,
      payload,
    )
    return response.data
  },

  async updateVenueNotificationOverride(
    campaignId: string,
    venueId: string,
    payload: UpdateCampaignNotificationConfigRequest,
  ) {
    const response = await api.put<CampaignNotificationConfig>(
      `/campaigns/${campaignId}/notifications/venues/${venueId}`,
      payload,
    )
    return response.data
  },

  async deleteVenueNotificationOverride(
    campaignId: string,
    venueId: string,
  ) {
    await api.delete<MessageResponse | undefined>(
      `/campaigns/${campaignId}/notifications/venues/${venueId}`,
    )
  },
}

