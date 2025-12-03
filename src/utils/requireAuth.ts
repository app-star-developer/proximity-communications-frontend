import { redirect } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'

import { queryKeys } from '../api/queryKeys'
import { usersApi } from '../api/modules/users'
import { authStore } from '../state/authStore'

export async function requireAuth(options: {
  queryClient: QueryClient
  locationHref: string
}) {
  const { queryClient, locationHref } = options
  const { accessToken } = authStore.getState()
  if (!accessToken) {
    throw redirect({
      to: '/login',
      search: {
        redirect: locationHref,
      },
    })
  }

  try {
    const profile = await queryClient.ensureQueryData({
      queryKey: queryKeys.currentUser,
      queryFn: usersApi.getCurrentUser,
    })
    return profile
  } catch (_error) {
    authStore.clearSession()
    throw redirect({
      to: '/login',
      search: {
        redirect: locationHref,
      },
    })
  }
}

