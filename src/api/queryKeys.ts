export const queryKeys = {
  currentUser: ['current-user'] as const,
  accessibleTenants: ['accessible-tenants'] as const,
  campaigns: (params?: unknown) => ['campaigns', params ?? {}] as const,
  campaign: (id: string) => ['campaign', id] as const,
  eventSummary: (params?: unknown) => ['event-summary', params ?? {}] as const,
  eventTimeseries: (params?: unknown) => ['event-timeseries', params ?? {}] as const,
  venues: (params?: unknown) => ['venues', params ?? {}] as const,
  venue: (id: string) => ['venue', id] as const,
  tenants: (params?: unknown) => ['tenants', params ?? {}] as const,
  tenant: (id: string) => ['tenant', id] as const,
  tenantUsers: (tenantId: string) => ['tenant-users', tenantId] as const,
  tenantUser: (tenantId: string, userId: string) => ['tenant-user', tenantId, userId] as const,
}

