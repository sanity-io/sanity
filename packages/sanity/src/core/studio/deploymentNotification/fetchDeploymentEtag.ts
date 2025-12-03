/**
 * Fetches the etag header from the root path to detect deployment changes
 *
 * @internal
 */
export async function fetchDeploymentEtag(): Promise<string | null> {
  try {
    const response = await fetch('/', {method: 'HEAD'})
    if (!response.ok) {
      return null
    }

    return response.headers.get('etag')
  } catch (error) {
    console.error('Error fetching deployment etag:', error)
    return null
  }
}
