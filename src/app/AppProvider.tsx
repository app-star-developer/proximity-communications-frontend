import { type PropsWithChildren, useMemo } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { queryClient } from './queryClient'

export function AppProvider({ children }: PropsWithChildren) {
  const devtoolsContainer = useMemo(
    () => (
      <ReactQueryDevtools initialIsOpen={false} position="bottom" />
    ),
    [],
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {devtoolsContainer}
    </QueryClientProvider>
  )
}

