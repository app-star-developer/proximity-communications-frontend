import type { PropsWithChildren } from 'react'

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-4 py-6 md:px-8">
        {children}
      </div>
    </div>
  )
}

