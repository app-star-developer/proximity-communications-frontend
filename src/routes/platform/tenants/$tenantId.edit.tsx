import { useEffect, useId, useState } from 'react'
import {
  Link,
  createFileRoute,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import type { AxiosError } from 'axios'
import type { QueryClient } from '@tanstack/react-query'

import { requireAuth } from '@/utils/requireAuth'
import { useTenant, useUpdateTenant } from '@/hooks/useTenants'
import { queryKeys } from '@/api/queryKeys'
import { tenantsApi } from '@/api/modules/tenants'
import type { ApiErrorResponse } from '@/api/types'
import { useUIStore } from '@/state/uiStore'
import { isPlatformUser } from '@/utils/permissions'
import { useAuthStore } from '@/state/authStore'

export const Route = createFileRoute('/platform/tenants/$tenantId/edit')({
  loader: async ({ params, context, location }) => {
    const { queryClient } = context as { queryClient: QueryClient }
    await requireAuth({
      queryClient,
      locationHref: location.href,
    })
    const { user } = useAuthStore.getState()
    if (!isPlatformUser(user)) {
      throw redirect({ to: '/' })
    }

    const tenantId = params.tenantId
    if (!tenantId) {
      throw redirect({ to: '/platform/tenants' })
    }

    try {
      const data = await queryClient.ensureQueryData({
        queryKey: queryKeys.tenant(tenantId),
        queryFn: () => tenantsApi.getById(tenantId),
      })
      return data
    } catch (error) {
      throw redirect({ to: '/platform/tenants' })
    }
  },
  component: TenantEditRoute,
})

function TenantEditRoute() {
  const navigate = useNavigate()
  const loaderData = Route.useLoaderData()
  const { pushToast } = useUIStore()
  const tenantQuery = useTenant(loaderData.id)
  const tenant = tenantQuery.data ?? loaderData

  const nameId = useId()
  const contactEmailId = useId()

  const [formState, setFormState] = useState({
    name: tenant.name,
    contactEmail: tenant.contactEmail ?? '',
  })

  useEffect(() => {
    setFormState({
      name: tenant.name,
      contactEmail: tenant.contactEmail ?? '',
    })
  }, [tenant])

  const updateMutation = useUpdateTenant()

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
        tenantId: tenant.id,
        payload: {
          name: formState.name,
          contactEmail: formState.contactEmail || undefined,
        },
      },
      {
        onSuccess: () => {
          pushToast({
            id: crypto.randomUUID(),
            title: 'Tenant updated',
            description: 'Your changes have been saved.',
            intent: 'success',
          })
          navigate({
            to: '/platform/tenants/$tenantId',
            params: { tenantId: tenant.id },
          })
        },
        onError: (error) => {
          const axiosError = error as AxiosError<ApiErrorResponse>
          pushToast({
            id: crypto.randomUUID(),
            title: 'Failed to update tenant',
            description:
              axiosError.response?.data && 'message' in axiosError.response.data
                ? axiosError.response.data.message
                : 'Please review the input and try again.',
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
            Edit tenant
          </p>
          <h1 className="text-2xl font-semibold text-white">{tenant.name}</h1>
        </div>
        <Link
          to="/platform/tenants/$tenantId"
          params={{ tenantId: tenant.id }}
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
              Name
            </label>
            <input
              id={nameId}
              name="name"
              value={formState.name}
              onChange={handleChange}
              required
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
        </div>

        <footer className="flex items-center justify-between pt-4">
          <Link
            to="/platform/tenants/$tenantId"
            params={{ tenantId: tenant.id }}
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
