import { useId, useState } from 'react'
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
import { useInviteUser } from '../../../hooks/useTenantUsers'
import type { ApiErrorResponse, AccessLevel } from '../../../api/types'
import { useUIStore } from '../../../state/uiStore'
import { canManageUsers } from '../../../utils/permissions'
import { useAuthStore } from '../../../state/authStore'

export const Route = createFileRoute('/tenants/$tenantId/users/invite')({
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
    return { tenantId: params.tenantId }
  },
  component: InviteUserRoute,
})

const ACCESS_LEVELS: { value: AccessLevel; label: string }[] = [
  { value: 'viewer', label: 'Viewer (Read-only)' },
  { value: 'editor', label: 'Editor (Read & Write)' },
  { value: 'admin', label: 'Admin (Full Access)' },
]

function InviteUserRoute() {
  const navigate = useNavigate()
  const { tenantId } = Route.useLoaderData()
  const { pushToast } = useUIStore()
  const emailId = useId()
  const passwordId = useId()
  const firstNameId = useId()
  const lastNameId = useId()
  const accessLevelId = useId()

  const [formState, setFormState] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    accessLevel: 'viewer' as AccessLevel,
  })

  const inviteMutation = useInviteUser()

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target
    setFormState((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    inviteMutation.mutate(
      {
        tenantId,
        payload: {
          email: formState.email,
          password: formState.password,
          firstName: formState.firstName || undefined,
          lastName: formState.lastName || undefined,
          accessLevel: formState.accessLevel,
        },
      },
      {
        onSuccess: () => {
          pushToast({
            id: crypto.randomUUID(),
            title: 'User invited',
            description: `${formState.email} has been invited to the tenant.`,
            intent: 'success',
          })
          navigate({
            to: '/tenants/$tenantId/users',
            params: { tenantId },
          })
        },
        onError: (error) => {
          const axiosError = error as AxiosError<ApiErrorResponse>
          const message =
            axiosError.response?.data && 'message' in axiosError.response.data
              ? axiosError.response.data.message
              : 'Failed to invite user. Check the input and try again.'
          pushToast({
            id: crypto.randomUUID(),
            title: 'Invitation failed',
            description: message,
            intent: 'danger',
          })
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/30 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Invite user
          </p>
          <h1 className="text-2xl font-semibold text-white">Invite user to tenant</h1>
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
              htmlFor={emailId}
              className="text-xs uppercase tracking-wide text-slate-500"
            >
              Email address *
            </label>
            <input
              id={emailId}
              name="email"
              type="email"
              value={formState.email}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor={passwordId}
              className="text-xs uppercase tracking-wide text-slate-500"
            >
              Password *
            </label>
            <input
              id={passwordId}
              name="password"
              type="password"
              value={formState.password}
              onChange={handleChange}
              required
              minLength={8}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor={firstNameId}
              className="text-xs uppercase tracking-wide text-slate-500"
            >
              First name
            </label>
            <input
              id={firstNameId}
              name="firstName"
              value={formState.firstName}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor={lastNameId}
              className="text-xs uppercase tracking-wide text-slate-500"
            >
              Last name
            </label>
            <input
              id={lastNameId}
              name="lastName"
              value={formState.lastName}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
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
            <p className="text-xs text-slate-500">
              For business users, use "Viewer" for read-only access to dashboards.
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
            disabled={inviteMutation.isPending}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:cursor-not-allowed disabled:bg-cyan-500/50"
          >
            {inviteMutation.isPending ? 'Inviting…' : 'Invite user'}
          </button>
        </footer>
      </form>
    </div>
  )
}
