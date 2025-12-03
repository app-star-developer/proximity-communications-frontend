import { api } from '../client'
import type {
  Campaign,
  CampaignListResponse,
  MessageResponse,
  CreateCampaignRequest,
  UpdateCampaignRequest,
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
}

