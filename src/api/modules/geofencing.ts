import { api } from '../client'
import type {
  GeofenceEvaluationRequest,
  GeofenceEvaluationResponse,
} from '../types'

export const geofencingApi = {
  async evaluateLocations(payload: GeofenceEvaluationRequest) {
    const response = await api.post<GeofenceEvaluationResponse>(
      '/geofencing/evaluate',
      payload,
    )
    return response.data
  },
}

