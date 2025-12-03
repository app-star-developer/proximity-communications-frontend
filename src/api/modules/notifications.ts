import { api } from '../client'
import type {
  NotificationSendRequest,
  NotificationSendResponse,
  NotificationReceiptsRequest,
  NotificationReceiptsResponse,
} from '../types'

export const notificationsApi = {
  async send(payload: NotificationSendRequest) {
    const response = await api.post<NotificationSendResponse>(
      '/notifications',
      payload,
    )
    return response.data
  },

  async submitReceipts(payload: NotificationReceiptsRequest) {
    const response = await api.post<NotificationReceiptsResponse>(
      '/notifications/receipts',
      payload,
    )
    return response.data
  },
}

