import type {CurrentUser} from '@sanity/types'

/**
 * Checks whether or not the given user has the role with the given ID
 *
 * @param user - The user to check (currently only the current user is supported)
 *   If `null` is passed, this function always returns `false`.
 * @param roleId - The ID of the role to check for
 *
 * @returns true if the user has the role, false otherwise
 *
 * @example
 * Fetch the current user and check if they have the role "administrator":
 * ```ts
 * import {userHasRole, useCurrentUser} from 'sanity'
 *
 * export function MyComponent() {
 *   const user = useCurrentUser()
 *   const hasAdminRole = userHasRole(user, 'administrator')
 *   return <div>Is administrator: {hasAdminRole ? 'Yes' : 'No'}</div>
 * }
 * ```
 * @public
 */
export function userHasRole(
  user: (Omit<CurrentUser, 'role'> & {role?: string}) | null,
  roleId: string
): boolean {
  return user !== null && user.roles.some((role) => role.name === roleId)
}
