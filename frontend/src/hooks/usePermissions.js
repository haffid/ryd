import { useAuth } from './useAuth'

/**
 * Returns helpers to check user permissions.
 *
 * Usage:
 *   const { can, hasRole } = usePermissions()
 *   if (can('users', 'read')) { ... }
 *   if (hasRole('admin')) { ... }
 */
export function usePermissions() {
  const { user } = useAuth()

  const can = (module, action) => {
    if (!user) return false
    return user.permissions.includes(`${module}:${action}`)
  }

  const hasRole = (roleName) => {
    if (!user) return false
    return user.role === roleName
  }

  const canAny = (...checks) => checks.some(([m, a]) => can(m, a))

  return { can, hasRole, canAny, permissions: user?.permissions ?? [] }
}
