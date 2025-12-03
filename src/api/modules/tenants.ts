import { api } from '../client'
import type {
  TenantResponse,
  TenantListResponse,
  CreateTenantRequest,
  UpdateTenantRequest,
} from '../types'

export interface TenantListParams {
  status?: 'active' | 'suspended'
  search?: string
  limit?: number
  offset?: number
}

export const tenantsApi = {
  async list(params: TenantListParams = {}) {
    const response = await api.get<TenantListResponse>('/tenants', {
      params,
    })
    return response.data
  },

  async getById(tenantId: string) {
    const response = await api.get<TenantResponse>(`/tenants/${tenantId}`)
    return response.data
  },

  async create(payload: CreateTenantRequest) {
    const response = await api.post<TenantResponse>('/tenants', payload)
    return response.data
  },

  async update(tenantId: string, payload: UpdateTenantRequest) {
    const response = await api.patch<TenantResponse>(
      `/tenants/${tenantId}`,
      payload,
    )
    return response.data
  },

  async suspend(tenantId: string) {
    const response = await api.post<TenantResponse>(
      `/tenants/${tenantId}/suspend`,
    )
    return response.data
  },

  async activate(tenantId: string) {
    const response = await api.post<TenantResponse>(
      `/tenants/${tenantId}/activate`,
    )
    return response.data
  },
}

