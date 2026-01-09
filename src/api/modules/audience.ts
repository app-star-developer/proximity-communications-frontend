import { api } from '../client'
import type {
  AudienceMetricsResponse,
  AudienceGrowthResponse,
  AudienceDevicesResponse,
  AudienceDeviceDetailsResponse,
  AudienceSegmentationResponse,
} from '../types'

export interface AudienceDevicesParams {
  limit?: number
  offset?: number
  search?: string
  campaignId?: string
  venueId?: string
  activeDays?: number
  platform?: string
  osName?: string
}

export interface AudienceGrowthParams {
  startDate?: string
  endDate?: string
}

export const audienceApi = {
  async getMetrics() {
    const response = await api.get<AudienceMetricsResponse>('/audience/metrics')
    return response.data
  },

  async getGrowth(params?: AudienceGrowthParams) {
    // Ensure all date params are strings (not Date objects)
    const queryParams: Record<string, string> = {}
    if (params?.startDate) {
      queryParams.startDate = typeof params.startDate === 'string' 
        ? params.startDate 
        : new Date(params.startDate).toISOString()
    }
    if (params?.endDate) {
      queryParams.endDate = typeof params.endDate === 'string'
        ? params.endDate
        : new Date(params.endDate).toISOString()
    }
    
    const response = await api.get<AudienceGrowthResponse>('/audience/growth', {
      params: queryParams,
    })
    return response.data
  },

  async getDevices(params?: AudienceDevicesParams) {
    const response = await api.get<AudienceDevicesResponse>('/audience/devices', {
      params,
    })
    console.log('devices', response.data)
    return response.data
  },

  async getDeviceDetails(deviceId: string) {
    const response = await api.get<AudienceDeviceDetailsResponse>(
      `/audience/devices/${deviceId}`,
    )
    return response.data
  },

  async getSegmentation() {
    const response = await api.get<AudienceSegmentationResponse>(
      '/audience/segmentation',
    )
    return response.data
  },
}

