import {type AccessRequest, type AccessRequestState} from './types'

/**
 * Access requests are considered active for two weeks, matching the Access
 * API's request lifetime.
 */
const REQUEST_LIFETIME_MS = 14 * 24 * 60 * 60 * 1000

/**
 * Derives where the caller stands on requesting access to a resource from
 * their existing access requests.
 *
 * A declined request blocks re-requesting for two weeks. A pending request
 * younger than two weeks is in review; older pending requests count as
 * expired, and the caller may request again.
 *
 * @public
 */
export function deriveAccessRequestState(
  requests: AccessRequest[] | null | undefined,
  resourceId: string,
  now: number = Date.now(),
): AccessRequestState {
  if (!requests || requests.length === 0) return 'none'

  const isRecent = (request: AccessRequest) =>
    now - new Date(request.createdAt).getTime() < REQUEST_LIFETIME_MS

  const forResource = requests.filter((request) => request.resourceId === resourceId)

  if (forResource.some((request) => request.status === 'declined' && isRecent(request))) {
    return 'denied'
  }
  if (forResource.some((request) => request.status === 'pending' && isRecent(request))) {
    return 'pending'
  }
  if (forResource.some((request) => request.status === 'pending')) {
    return 'expired'
  }
  return 'none'
}
