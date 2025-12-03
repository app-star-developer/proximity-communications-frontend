import { api } from '../client'
import type {
  TenantUserResponse,
  TenantUserListResponse,
  InviteUserRequest,
  UpdateUserAccessRequest,
} from '../types'

export const tenantUsersApi = {
  async list(tenantId: string) {
    const response = await api.get<TenantUserListResponse>(
      `/tenants/${tenantId}/users`,
    )
    return response.data
  },

  async invite(tenantId: string, payload: InviteUserRequest) {
    const response = await api.post<TenantUserResponse>(
      `/tenants/${tenantId}/users/invite`,
      payload,
    )
    return response.data
  },

  async updateAccess(
    tenantId: string,
    userId: string,
    payload: UpdateUserAccessRequest,
  ) {
    const response = await api.patch<TenantUserResponse>(
      `/tenants/${tenantId}/users/${userId}`,
      payload,
    )
    return response.data
  },

  async remove(tenantId: string, userId: string) {
    await api.delete(`/tenants/${tenantId}/users/${userId}`)
  },
}

