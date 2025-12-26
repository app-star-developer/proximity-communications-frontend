import { createFileRoute, redirect } from '@tanstack/react-router'

// Legacy route kept for backwards compatibility.
// Canonical tenant detail route is now /platform/tenants/$tenantId
export const Route = createFileRoute('/platform/$tenantId')({
  loader: ({ params }) => {
    throw redirect({
      to: '/platform/tenants/$tenantId',
      params: { tenantId: params.tenantId },
    })
  },
  component: () => null,
})
