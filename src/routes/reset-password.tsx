import { useId, useState } from 'react'
import { createFileRoute, Link, redirect, useSearch } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import type { AxiosError } from 'axios'

import { authApi } from '../api/modules/auth'
import type { ApiErrorResponse } from '../api/types'
import { authStore } from '../state/authStore'
import { useUIStore } from '../state/uiStore'

type ResetSearch = {
  token?: string
}

export const Route = createFileRoute('/reset-password')({
  loader: () => {
    const { accessToken } = authStore.getState()
    if (accessToken) {
      throw redirect({ to: '/' })
    }
    return null
  },
  validateSearch: (search: Record<string, unknown>): ResetSearch => ({
    token: typeof search.token === 'string' ? search.token : undefined,
  }),
  component: ResetPasswordRoute,
})

function ResetPasswordRoute() {
  const search = useSearch({ from: Route.fullPath })
  const passwordId = useId()
  const confirmId = useId()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const { pushToast } = useUIStore()

  const mutation = useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: (response) => {
      pushToast({
        id: crypto.randomUUID(),
        title: 'Password reset',
        description: response.message ?? 'You can now sign in with your new password.',
        intent: 'success',
      })
      setPassword('')
      setConfirmPassword('')
    },
    onError: (error) => {
      const axiosError = error as AxiosError<ApiErrorResponse>
      const message =
        axiosError.response?.data && 'message' in axiosError.response.data
          ? axiosError.response.data.message
          : 'Unable to reset password. Please request a new link.'
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
    if (!search.token) {
      pushToast({
        id: crypto.randomUUID(),
        title: 'Missing reset token',
        description: 'Follow the link in your email or request another reset.',
        intent: 'warning',
      })
      return
    }

    if (password !== confirmPassword) {
      pushToast({
        id: crypto.randomUUID(),
        title: 'Passwords do not match',
        description: 'Ensure both password fields are identical.',
        intent: 'warning',
      })
      return
    }

    mutation.mutate({ token: search.token, password })
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-lg flex-col justify-center gap-6 p-6">
      <section className="space-y-3 text-center">
        <h1 className="text-2xl font-semibold text-white">Choose a new password</h1>
        <p className="text-sm text-slate-400">
          Passwords must be at least 8 characters long. For security, links expire after a short
          period.
        </p>
      </section>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/30"
      >
        <div className="space-y-2">
          <label htmlFor={passwordId} className="text-xs uppercase tracking-wide text-slate-500">
            New password
          </label>
          <input
            id={passwordId}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor={confirmId} className="text-xs uppercase tracking-wide text-slate-500">
            Confirm password
          </label>
          <input
            id={confirmId}
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={8}
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
          />
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:cursor-not-allowed disabled:bg-cyan-500/50"
        >
          {mutation.isPending ? 'Resetting…' : 'Reset password'}
        </button>
      </form>
      <p className="text-center text-xs text-slate-500">
        Need a new link?{' '}
        <Link to="/forgot-password" className="text-cyan-300 hover:underline">
          Request another reset
        </Link>
      </p>
    </div>
  )
}
