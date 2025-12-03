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
import { useCreateTenant } from '../../../hooks/useTenants'
import type { ApiErrorResponse } from '../../../api/types'
import { useUIStore } from '../../../state/uiStore'
import { isPlatformUser } from '../../../utils/permissions'
import { useAuthStore } from '../../../state/authStore'

export const Route = createFileRoute('/platform/tenants/new')({
  loader: async ({ context, location }) => {
    const { queryClient } = context as { queryClient: QueryClient }
    await requireAuth({
      queryClient,
      locationHref: location.href,
    })
    const { user } = useAuthStore.getState()
    if (!isPlatformUser(user)) {
      throw redirect({ to: '/' })
    }
    return null
  },
  component: NewTenantRoute,
})

function NewTenantRoute() {
  const navigate = useNavigate()
  const { pushToast } = useUIStore()
  const nameId = useId()
  const slugId = useId()
  const contactEmailId = useId()
  const adminEmailId = useId()
  const passwordId = useId()
  const firstNameId = useId()
  const lastNameId = useId()

  const [formState, setFormState] = useState({
    tenantName: '',
    tenantSlug: '',
    contactEmail: '',
    adminEmail: '',
    password: '',
    firstName: '',
    lastName: '',
  })

  const createMutation = useCreateTenant()

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = event.target
    setFormState((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    createMutation.mutate(
      {
        tenantName: formState.tenantName,
        tenantSlug: formState.tenantSlug || undefined,
        contactEmail: formState.contactEmail || undefined,
        adminEmail: formState.adminEmail,
        password: formState.password,
        firstName: formState.firstName || undefined,
        lastName: formState.lastName || undefined,
      },
      {
        onSuccess: (created) => {
          pushToast({
            id: crypto.randomUUID(),
            title: 'Tenant created',
            description: `${created.name} has been created successfully.`,
            intent: 'success',
          })
          navigate({
            to: '/platform/tenants/$tenantId',
            params: { tenantId: created.id },
          })
        },
        onError: (error) => {
          const axiosError = error as AxiosError<ApiErrorResponse>
          const message =
            axiosError.response?.data && 'message' in axiosError.response.data
              ? axiosError.response.data.message
              : 'Failed to create tenant. Check the input and try again.'
          pushToast({
            id: crypto.randomUUID(),
            title: 'Creation failed',
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
            New tenant
          </p>
          <h1 className="text-2xl font-semibold text-white">Create tenant</h1>
        </div>
        <Link
          to="/platform/tenants"
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
              htmlFor={nameId}
              className="text-xs uppercase tracking-wide text-slate-500"
            >
              Tenant name *
            </label>
            <input
              id={nameId}
              name="tenantName"
              value={formState.tenantName}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor={slugId}
              className="text-xs uppercase tracking-wide text-slate-500"
            >
              Tenant slug
            </label>
            <input
              id={slugId}
              name="tenantSlug"
              value={formState.tenantSlug}
              onChange={handleChange}
              placeholder="auto-generated"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor={contactEmailId}
              className="text-xs uppercase tracking-wide text-slate-500"
            >
              Contact email
            </label>
            <input
              id={contactEmailId}
              name="contactEmail"
              type="email"
              value={formState.contactEmail}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor={adminEmailId}
              className="text-xs uppercase tracking-wide text-slate-500"
            >
              Admin email *
            </label>
            <input
              id={adminEmailId}
              name="adminEmail"
              type="email"
              value={formState.adminEmail}
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
              Admin password *
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
        </div>

        <footer className="flex items-center justify-between pt-4">
          <Link
            to="/platform/tenants"
            className="text-sm text-slate-400 hover:text-slate-200"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:cursor-not-allowed disabled:bg-cyan-500/50"
          >
            {createMutation.isPending ? 'Creating…' : 'Create tenant'}
          </button>
        </footer>
      </form>
    </div>
  )
}


export const Route = createFileRoute('/platform/tenants/new')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/platform/tenants/new"!</div>
}
