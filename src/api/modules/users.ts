import { api } from '../client'
import type { UserProfileResponse } from '../types'
import { authStore } from '../../state/authStore'

export const usersApi = {
  async getCurrentUser() {
    const response = await api.get<UserProfileResponse>('/users/me')
    authStore.markAuthenticated(response.data.user)
    return response.data
  },
}

