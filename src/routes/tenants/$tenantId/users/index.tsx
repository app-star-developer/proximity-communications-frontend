import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import type { AxiosError } from 'axios'
import type { QueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'

import { requireAuth } from '@/utils/requireAuth'
import { useTenantUserList, useRemoveUser } from '@/hooks/useTenantUsers'
import type { ApiErrorResponse } from '@/api/types'
import { useUIStore } from '@/state/uiStore'
import { canManageUsers } from '@/utils/permissions'
import { useAuthStore } from '@/state/authStore'

export const Route = createFileRoute('/tenants/$tenantId/users/')({
  loader: async ({ params, context, location }) => {
    const { queryClient } = context as { queryClient: QueryClient }
    await requireAuth({
      queryClient,
      locationHref: location.href,
    })
    const { user } = useAuthStore.getState()
    // Note: In a real implementation, you'd check the user's access level for this organization
    // For now, we'll allow access if they're a platform user or have admin access
    if (!user?.isPlatformUser && !canManageUsers(user)) {
      throw redirect({ to: '/' })
    }
    return { tenantId: params.tenantId }
  },
  component: TenantUsersListRoute,
})

function TenantUsersListRoute() {
  const { tenantId } = Route.useLoaderData()
  const { pushToast } = useUIStore()
  const usersQuery = useTenantUserList(tenantId)
  const removeMutation = useRemoveUser()

  const users = usersQuery.data?.data ?? []

  const handleRemove = (userId: string, email: string) => {
    if (
      !window.confirm(
        `Remove ${email} from this organization? They will lose all access.`,
      )
    ) {
      return
    }
    removeMutation.mutate(
      { tenantId, userId },
      {
        onSuccess: () => {
          pushToast({
            id: crypto.randomUUID(),
            title: 'User removed',
            description: 'The user has been removed from the organization.',
            intent: 'success',
          })
        },
        onError: (error) => {
          const axiosError = error as AxiosError<ApiErrorResponse>
          pushToast({
            id: crypto.randomUUID(),
            title: 'Failed to remove user',
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

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/30 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Organization users</h2>
          <p className="mt-1 text-sm text-slate-400">
            Manage users with access to this organization.
          </p>
        </div>
        <Link
          to="/tenants/$tenantId/users/invite"
          params={{ tenantId }}
          className="inline-flex items-center justify-center rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
        >
          Invite user
        </Link>
      </header>

      <section className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/20">
        {usersQuery.isLoading ? (
          <div className="text-center text-sm text-slate-500">Loading...</div>
        ) : users.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-4 py-8 text-center text-sm text-slate-400">
            No users found. Invite users to grant them access.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-800/70 bg-slate-950/50">
            <table className="min-w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/70 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Access level</th>
                  <th className="px-4 py-3">Granted</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-slate-800/70">
                    <td className="px-4 py-3 text-white">{user.email}</td>
                    <td className="px-4 py-3">
                      {user.firstName || user.lastName
                        ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                          user.status === 'active'
                            ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                            : user.status === 'invited'
                              ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                              : 'bg-red-500/20 text-red-200 border border-red-500/40'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize">{user.accessLevel}</td>
                    <td className="px-4 py-3">
                      {format(parseISO(user.grantedAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          to="/tenants/$tenantId/users/$userId/edit"
                          params={{ tenantId, userId: user.id }}
                          className="text-xs text-cyan-300 hover:underline"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleRemove(user.id, user.email)}
                          disabled={removeMutation.isPending}
                          className="text-xs text-red-300 hover:underline disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
