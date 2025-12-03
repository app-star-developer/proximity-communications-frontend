import { useId, useState } from 'react'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import type { AxiosError } from 'axios'

import { authStore } from '../state/authStore'
import { authApi } from '../api/modules/auth'
import type { ApiErrorResponse } from '../api/types'
import { useUIStore } from '../state/uiStore'

export const Route = createFileRoute('/forgot-password')({
  loader: () => {
    const { accessToken } = authStore.getState()
    if (accessToken) {
      throw redirect({ to: '/' })
    }
    return null
  },
  component: ForgotPasswordRoute,
})

function ForgotPasswordRoute() {
  const tenantId = useId()
  const emailId = useId()
  const [tenant, setTenant] = useState('')
  const [email, setEmail] = useState('')
  const { pushToast } = useUIStore()

  const mutation = useMutation({
    mutationFn: authApi.requestPasswordReset,
    onSuccess: (response) => {
      pushToast({
        id: crypto.randomUUID(),
        title: 'Reset email sent',
        description: response.message ?? 'Check your inbox for further instructions.',
        intent: 'success',
      })
      setEmail('')
      setTenant('')
    },
    onError: (error) => {
      const axiosError = error as AxiosError<ApiErrorResponse>
      const message =
        axiosError.response?.data && 'message' in axiosError.response.data
          ? axiosError.response.data.message
          : 'Unable to send reset email. Please verify your tenant and email.'
      pushToast({
        id: crypto.randomUUID(),
        title: 'Reset failed',
        description: message,
        intent: 'danger',
      })
    },
  })

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    mutation.mutate({ tenant, email })
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-lg flex-col justify-center gap-6 p-6">
      <section className="space-y-3 text-center">
        <h1 className="text-2xl font-semibold text-white">Reset your password</h1>
        <p className="text-sm text-slate-400">
          Enter the tenant slug and email you use with Proximity Communications. We'll send a reset
          link if the account exists.
        </p>
      </section>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/30"
      >
        <div className="space-y-2">
          <label htmlFor={tenantId} className="text-xs uppercase tracking-wide text-slate-500">
            Tenant slug
          </label>
          <input
            id={tenantId}
            name="tenant"
            value={tenant}
            onChange={(event) => setTenant(event.target.value)}
            required
            placeholder="guinness"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor={emailId} className="text-xs uppercase tracking-wide text-slate-500">
            Email address
          </label>
          <input
            id={emailId}
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="you@example.com"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
          />
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:cursor-not-allowed disabled:bg-cyan-500/50"
        >
          {mutation.isPending ? 'Sending…' : 'Email reset link'}
        </button>
      </form>
      <p className="text-center text-xs text-slate-500">
        Remembered your password?{' '}
        <Link to="/login" className="text-cyan-300 hover:underline">
          Go back to sign in
        </Link>
      </p>
    </div>
  )
}
