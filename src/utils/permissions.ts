import type { AuthenticatedUser, AccessLevel } from '../api/types'

export function hasAccessLevel(
  user: AuthenticatedUser | null | undefined,
  // requiredLevel: AccessLevel,
): boolean {
  if (!user) return false

  // Platform superusers have admin access to all organizations
  if (user.isPlatformUser) return true

  // For organization users, check their access level
  // This would need to be stored in the user object or fetched separately
  // For now, we'll assume all organization users have at least viewer access
  // In a real implementation, you'd check the user's accessLevel for the current tenant
  return true
}

export function isPlatformUser(
  user: AuthenticatedUser | null | undefined,
): boolean {
  return user?.isPlatformUser ?? false
}

export function isAdmin(
  user: AuthenticatedUser | null | undefined,
  accessLevel?: AccessLevel,
): boolean {
  if (!user) return false
  if (user.isPlatformUser) return true
  return accessLevel === 'admin'
}

export function isEditor(
  user: AuthenticatedUser | null | undefined,
  accessLevel?: AccessLevel,
): boolean {
  if (!user) return false
  if (user.isPlatformUser) return true
  return accessLevel === 'editor' || accessLevel === 'admin'
}

export function canEdit(
  user: AuthenticatedUser | null | undefined,
  accessLevel?: AccessLevel,
): boolean {
  return isEditor(user, accessLevel) || isAdmin(user, accessLevel)
}

export function canManageUsers(
  user: AuthenticatedUser | null | undefined,
  accessLevel?: AccessLevel,
): boolean {
  return isAdmin(user, accessLevel)
}

