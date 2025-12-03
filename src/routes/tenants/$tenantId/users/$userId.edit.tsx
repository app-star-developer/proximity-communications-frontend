import { useEffect, useId, useState } from 'react'
import {
  Link,
  createFileRoute,
  useNavigate,
  redirect,
} from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import type { QueryClient } from '@tanstack/react-query'

import { requireAuth } from '../../../utils/requireAuth'
import { useTenantUserList, useUpdateUserAccess } from '../../../hooks/useTenantUsers'
import type { ApiErrorResponse, AccessLevel } from '../../../api/types'
import { useUIStore } from '../../../state/uiStore'
import { canManageUsers } from '../../../utils/permissions'
import { useAuthStore } from '../../../state/authStore'

export const Route = createFileRoute('/tenants/$tenantId/users/$userId/edit')({
  loader: async ({ params, context, location }) => {
    const { queryClient } = context as { queryClient: QueryClient }
    await requireAuth({
      queryClient,
      locationHref: location.href,
    })
    const { user } = useAuthStore.getState()
    if (!user?.isPlatformUser && !canManageUsers(user)) {
      throw redirect({ to: '/' })
    }
    return { tenantId: params.tenantId, userId: params.userId }
  },
  component: EditUserRoute,
})

const ACCESS_LEVELS: { value: AccessLevel; label: string }[] = [
  { value: 'viewer', label: 'Viewer (Read-only)' },
  { value: 'editor', label: 'Editor (Read & Write)' },
  { value: 'admin', label: 'Admin (Full Access)' },
]

function EditUserRoute() {
  const navigate = useNavigate()
  const { tenantId, userId } = Route.useLoaderData()
  const { pushToast } = useUIStore()
  const usersQuery = useTenantUserList(tenantId)
  const updateMutation = useUpdateUserAccess()
  const accessLevelId = useId()
  const expiresAtId = useId()

  const user = usersQuery.data?.data.find((u) => u.id === userId)

  const [formState, setFormState] = useState({
    accessLevel: 'viewer' as AccessLevel,
    expiresAt: '',
  })

  useEffect(() => {
    if (user) {
      setFormState({
        accessLevel: user.accessLevel,
        expiresAt: user.expiresAt
          ? new Date(user.expiresAt).toISOString().slice(0, 16)
          : '',
      })
    }
  }, [user])

  const handleChange = (
    event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>,
  ) => {
    const { name, value } = event.target
    setFormState((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    updateMutation.mutate(
      {
        tenantId,
        userId,
        payload: {
          accessLevel: formState.accessLevel,
          expiresAt: formState.expiresAt
            ? new Date(formState.expiresAt).toISOString()
            : null,
        },
      },
      {
        onSuccess: () => {
          pushToast({
            id: crypto.randomUUID(),
            title: 'User access updated',
            description: 'The user access level has been updated.',
            intent: 'success',
          })
          navigate({
            to: '/tenants/$tenantId/users',
            params: { tenantId },
          })
        },
        onError: (error) => {
          const axiosError = error as AxiosError<ApiErrorResponse>
          pushToast({
            id: crypto.randomUUID(),
            title: 'Failed to update user',
            description:
              axiosError.response?.data && 'message' in axiosError.response.data
                ? axiosError.response.data.message
                : 'Please try again.',
            intent: 'danger',
          })
        },
      },
    )
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6">
          <p className="text-sm text-slate-400">Loading user...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/30 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Edit user access
          </p>
          <h1 className="text-2xl font-semibold text-white">{user.email}</h1>
        </div>
        <Link
          to="/tenants/$tenantId/users"
          params={{ tenantId }}
          className="text-sm text-slate-400 transition hover:text-slate-100"
        >
          Cancel
        </Link>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/20"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor={accessLevelId}
              className="text-xs uppercase tracking-wide text-slate-500"
            >
              Access level *
            </label>
            <select
              id={accessLevelId}
              name="accessLevel"
              value={formState.accessLevel}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            >
              {ACCESS_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label
              htmlFor={expiresAtId}
              className="text-xs uppercase tracking-wide text-slate-500"
            >
              Expires at (optional)
            </label>
            <input
              id={expiresAtId}
              name="expiresAt"
              type="datetime-local"
              value={formState.expiresAt}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            />
            <p className="text-xs text-slate-500">
              Leave empty for no expiration. Set to remove expiration.
            </p>
          </div>
        </div>

        <footer className="flex items-center justify-between pt-4">
          <Link
            to="/tenants/$tenantId/users"
            params={{ tenantId }}
            className="text-sm text-slate-400 hover:text-slate-200"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:cursor-not-allowed disabled:bg-cyan-500/50"
          >
            {updateMutation.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </footer>
      </form>
    </div>
  )
}
