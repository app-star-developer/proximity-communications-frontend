import { api } from '../client'
import type {
  PromoCode,
  PromoCodeListResponse,
  CreatePromoCodeRequest,
  UpdatePromoCodeRequest,
  RegeneratePromoCodeRequest,
  RegeneratePromoCodeResponse,
  PromoCodeRedemptionListResponse,
  RedeemPromoCodeRequest,
  RedeemPromoCodeResponse,
  PromoCodeStatusResponse,
} from '../types'

export interface PromoCodeRedemptionListParams {
  status?: 'pending' | 'verified'
  venueId?: string
}

export const promoCodesApi = {
  // Campaign Promo Code Management
  async list(campaignId: string) {
    const response = await api.get<PromoCodeListResponse>(
      `/campaigns/${campaignId}/promo-codes`,
    )
    return response.data
  },

  async create(campaignId: string, payload: CreatePromoCodeRequest) {
    const response = await api.post<PromoCode>(
      `/campaigns/${campaignId}/promo-codes`,
      payload,
    )
    return response.data
  },

  async update(promoCodeId: string, payload: UpdatePromoCodeRequest) {
    const response = await api.put<PromoCode>(
      `/promo-codes/${promoCodeId}`,
      payload,
    )
    return response.data
  },

  async delete(promoCodeId: string) {
    await api.delete(`/promo-codes/${promoCodeId}`)
  },

  async regenerate(
    promoCodeId: string,
    payload?: RegeneratePromoCodeRequest,
  ) {
    const response = await api.post<RegeneratePromoCodeResponse>(
      `/promo-codes/${promoCodeId}/regenerate`,
      payload,
    )
    return response.data
  },

  // Promo Code Status & Redemption (for mobile/venue owner)
  async getStatus(code: string) {
    const response = await api.get<PromoCodeStatusResponse>(
      `/mobile/promo-codes/${code}/status`,
    )
    return response.data
  },

  async redeem(code: string, payload: RedeemPromoCodeRequest) {
    const response = await api.post<RedeemPromoCodeResponse>(
      `/mobile/promo-codes/${code}/redeem`,
      payload,
    )
    return response.data
  },

  // Venue Owner Redemption Management
  async listRedemptions(params?: PromoCodeRedemptionListParams) {
    const response = await api.get<PromoCodeRedemptionListResponse>(
      '/venue-owner/promo-codes/redemptions',
      { params },
    )
    return response.data
  },

  async verifyRedemption(promoCode: string, redemptionId: string) {
    const response = await api.post(
      `/venue-owner/promo-codes/${promoCode}/verify`,
      { redemptionId },
    )
    return response.data
  },
}

