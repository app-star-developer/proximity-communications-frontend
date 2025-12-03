import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60_000,
      retry: (failureCount, error) => {
        if (failureCount >= 3) {
          return false
        }

        const status =
          (error as { response?: { status?: number } })?.response?.status ?? 0
        if (status >= 400 && status < 500) {
          return false
        }

        return true
      },
    },
    mutations: {
      retry: 0,
    },
  },
})

