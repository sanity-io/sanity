import type {LoginMethod, CookielessCompatibleLoginMethod} from '../../../../config'

/**
 * Check whether the provided login method is compatible with cookieless auth, e.g. whether any
 * authentication token found in localStorage should be acknowledged.
 *
 * @internal
 */
export function isCookielessCompatibleLoginMethod(
  loginMethod: LoginMethod,
): loginMethod is CookielessCompatibleLoginMethod {
  const cookielessCompatibleLoginMethods = ['dual', 'token']
  return cookielessCompatibleLoginMethods.includes(loginMethod as CookielessCompatibleLoginMethod)
}
