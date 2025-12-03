import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import {
  campaignsApi,
  type CampaignListParams,
} from '../api/modules/campaigns'
import { queryKeys } from '../api/queryKeys'

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


