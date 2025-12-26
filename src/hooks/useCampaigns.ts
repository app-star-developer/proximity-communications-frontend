import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import {
  campaignsApi,
  type CampaignListParams,
} from '../api/modules/campaigns'
import { queryKeys } from '../api/queryKeys'
import type {
  CreateCampaignNotificationConfigRequest,
  UpdateCampaignNotificationConfigRequest,
} from '../api/types'

export function useCampaignList(params: CampaignListParams) {
  const filters = useMemo(() => params, [params])

  return useQuery({
    queryKey: queryKeys.campaigns(filters),
    queryFn: () => campaignsApi.list(filters),
    staleTime: 60_000,
  })
}

export function useCampaignDetail(campaignId: string) {
  return useQuery({
    queryKey: queryKeys.campaign(campaignId),
    queryFn: () => campaignsApi.getById(campaignId),
    enabled: Boolean(campaignId),
  })
}

// Campaign Notification Configuration Hooks
export function useCampaignNotificationConfig(campaignId: string) {
  return useQuery({
    queryKey: queryKeys.campaignNotificationConfig(campaignId),
    queryFn: () => campaignsApi.getNotificationConfig(campaignId),
    enabled: Boolean(campaignId),
  })
}

// Upsert hook - uses POST which creates or updates (backend upsert)
export function useUpsertCampaignNotificationConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      campaignId,
      payload,
    }: {
      campaignId: string
      payload: CreateCampaignNotificationConfigRequest
    }) => campaignsApi.upsertNotificationConfig(campaignId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.campaignNotificationConfig(variables.campaignId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.campaign(variables.campaignId),
      })
    },
  })
}

export function useCreateCampaignNotificationConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      campaignId,
      payload,
    }: {
      campaignId: string
      payload: CreateCampaignNotificationConfigRequest
    }) => campaignsApi.createNotificationConfig(campaignId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.campaignNotificationConfig(variables.campaignId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.campaign(variables.campaignId),
      })
    },
  })
}

export function useUpdateCampaignNotificationConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      campaignId,
      notificationId,
      payload,
    }: {
      campaignId: string
      notificationId: string
      payload: UpdateCampaignNotificationConfigRequest
    }) =>
      campaignsApi.updateNotificationConfig(
        campaignId,
        notificationId,
        payload,
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.campaignNotificationConfig(variables.campaignId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.campaign(variables.campaignId),
      })
    },
  })
}

export function useDeleteCampaignNotificationConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      campaignId,
      notificationId,
    }: {
      campaignId: string
      notificationId: string
    }) => campaignsApi.deleteNotificationConfig(campaignId, notificationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.campaignNotificationConfig(variables.campaignId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.campaign(variables.campaignId),
      })
    },
  })
}


