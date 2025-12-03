import { redirect } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'

import { requireAuth } from './requireAuth'
import { isPlatformUser } from './permissions'
import { useAuthStore } from '../state/authStore'

export async function requirePlatform(options: {
  queryClient: QueryClient
  locationHref: string
}) {
  const profile = await requireAuth(options)
  const { user } = useAuthStore.getState()
  if (!isPlatformUser(user)) {
    throw redirect({ to: '/' })
  }
  return profile
}

