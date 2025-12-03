import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tenantsApi, type TenantListParams } from '../api/modules/tenants'
import { queryKeys } from '../api/queryKeys'
import type { CreateTenantRequest, UpdateTenantRequest } from '../api/types'

export function useTenantList(params: TenantListParams = {}) {
  return useQuery({
    queryKey: queryKeys.tenants(params),
    queryFn: () => tenantsApi.list(params),
  })
}

export function useTenant(tenantId: string) {
  return useQuery({
    queryKey: queryKeys.tenant(tenantId),
    queryFn: () => tenantsApi.getById(tenantId),
    enabled: !!tenantId,
  })
}

export function useCreateTenant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTenantRequest) => tenantsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants({}) })
    },
  })
}

export function useUpdateTenant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      tenantId,
      payload,
    }: {
      tenantId: string
      payload: UpdateTenantRequest
    }) => tenantsApi.update(tenantId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenant(variables.tenantId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants({}) })
    },
  })
}

export function useSuspendTenant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (tenantId: string) => tenantsApi.suspend(tenantId),
    onSuccess: (_, tenantId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenant(tenantId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants({}) })
    },
  })
}

export function useActivateTenant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (tenantId: string) => tenantsApi.activate(tenantId),
    onSuccess: (_, tenantId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenant(tenantId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants({}) })
    },
  })
}

