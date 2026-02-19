import { api } from '../client'
import type { Country, State, Lga } from '../types'

export const locationsApi = {
  async getCountries() {
    const response = await api.get<{ data: Country[] }>('/locations/countries')
    return response.data.data
  },

  async getStates(countryId: string) {
    const response = await api.get<{ data: State[] }>(
      `/locations/countries/${countryId}/states`,
    )
    return response.data.data
  },

  async getLgas(stateId: string) {
    const response = await api.get<{ data: Lga[] }>(
      `/locations/states/${stateId}/lgas`,
    )
    return response.data.data
  },
}
