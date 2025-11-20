/**
 * Determines if deployment checking should be enabled based on hostname
 *
 * @internal
 */
export function shouldCheckForDeployment(): boolean {
  // Only run in browser environment and on Sanity domains where we know we can reason
  // about the etag value being updated on (and only on) a redeployment
  if (typeof window === 'undefined' || !window.location) {
    return false
  }

  // Check if hostname matches *.sanity.studio
  const hostname = window.location.hostname
  return hostname.endsWith('.sanity.studio') || hostname.endsWith('.studio.sanity.work')
}
