import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tenantUsersApi } from '../api/modules/tenantUsers'
import { queryKeys } from '../api/queryKeys'
import type { InviteUserRequest, UpdateUserAccessRequest } from '../api/types'

export function useTenantUserList(tenantId: string) {
  return useQuery({
    queryKey: queryKeys.tenantUsers(tenantId),
    queryFn: () => tenantUsersApi.list(tenantId),
    enabled: !!tenantId,
  })
}

export function useInviteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      tenantId,
      payload,
    }: {
      tenantId: string
      payload: InviteUserRequest
    }) => tenantUsersApi.invite(tenantId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tenantUsers(variables.tenantId),
      })
    },
  })
}

export function useUpdateUserAccess() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      tenantId,
      userId,
      payload,
    }: {
      tenantId: string
      userId: string
      payload: UpdateUserAccessRequest
    }) => tenantUsersApi.updateAccess(tenantId, userId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tenantUsers(variables.tenantId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.tenantUser(variables.tenantId, variables.userId),
      })
    },
  })
}

export function useRemoveUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ tenantId, userId }: { tenantId: string; userId: string }) =>
      tenantUsersApi.remove(tenantId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tenantUsers(variables.tenantId),
      })
    },
  })
}

