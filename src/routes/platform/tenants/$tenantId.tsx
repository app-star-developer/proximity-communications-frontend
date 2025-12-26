import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { format, parseISO } from 'date-fns'
import type { QueryClient } from '@tanstack/react-query'

import { requireAuth } from '@/utils/requireAuth'
import { useTenant } from '@/hooks/useTenants'
import { queryKeys } from '@/api/queryKeys'
import { tenantsApi } from '@/api/modules/tenants'
import { isPlatformUser } from '@/utils/permissions'
import { useAuthStore } from '@/state/authStore'

export const Route = createFileRoute('/platform/tenants/$tenantId')({
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
    } catch {
      throw redirect({ to: '/platform/tenants' })
    }
  },
  component: TenantDetailRoute,
})

function TenantDetailRoute() {
  const tenant = Route.useLoaderData()
  const tenantQuery = useTenant(tenant.id)
  const tenantData = tenantQuery.data ?? tenant

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/30 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Tenant</p>
          <h1 className="text-2xl font-semibold text-white">{tenantData.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/platform/tenants/$tenantId/edit"
            params={{ tenantId: tenantData.id }}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300"
          >
            Edit
          </Link>
          <Link
            to="/platform/tenants"
            className="text-sm text-slate-400 transition hover:text-slate-100"
          >
            Back to list
          </Link>
        </div>
      </header>

      <section className="grid gap-6 rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/20 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 text-base font-semibold text-white">Details</h2>
          <dl className="space-y-3 text-sm text-slate-300">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Slug</dt>
              <dd className="mt-1 font-medium text-slate-200">{tenantData.slug}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Status</dt>
              <dd className="mt-1 font-medium capitalize text-slate-200">
                {tenantData.status}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Contact email
              </dt>
              <dd className="mt-1 font-medium text-slate-200">
                {tenantData.contactEmail ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Created
              </dt>
              <dd className="mt-1 font-medium text-slate-200">
                {format(parseISO(tenantData.createdAt), 'MMM d, yyyy')}
              </dd>
            </div>
          </dl>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-xs text-slate-400">
          <p className="font-semibold text-slate-200">Next</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Wire tenant users management under this tenant.</li>
            <li>Add audit logs and billing metadata (if needed).</li>
          </ul>
        </div>
      </section>
    </div>
  )
}

