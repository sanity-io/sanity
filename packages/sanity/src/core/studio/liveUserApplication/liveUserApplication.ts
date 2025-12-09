import {type WorkspaceSummary} from '../../config/types'
import {type UserApplication, type UserApplicationCache} from '../../store/userApplications'

function getAppUrl(app: UserApplication): string {
  const isStaging = app.apiHost !== undefined && app.apiHost.includes('sanity.work')
  const internalUrlSuffix = isStaging ? 'studio.sanity.work' : 'sanity.studio'

  return app.urlType === 'internal' ? `https://${app.appHost}.${internalUrlSuffix}` : app.appHost
}

/**
 * Check if the current URL matches an app URL.
 * Matches if the pathname is exactly equal or is a subpath (on segment boundaries).
 */
function currentUrlMatchesApp({origin, pathname}: Location, appUrl: string): boolean {
  const url = new URL(appUrl)
  if (origin !== url.origin) return false

  const appPathname = url.pathname
  // Exact match
  if (pathname === appPathname) return true
  // Subpath match: pathname must start with appPathname followed by '/'
  // e.g., '/admin/settings' matches '/admin', but '/administrator' does not
  return pathname.startsWith(appPathname.endsWith('/') ? appPathname : `${appPathname}/`)
}

export async function findUserApplication(
  cache: UserApplicationCache,
  workspaces: WorkspaceSummary[],
): Promise<UserApplication | undefined> {
  // If configuredAppId is set, fetch it. If the appHost matches the current window location, return the id
  // Else, for each unique project in the workspaces, fetch the user application by appHost

  // Ensure we are running in a browser context
  if (typeof window === 'undefined' || !window.location) {
    return undefined
  }

  // Get unique project IDs from workspaces
  const entities = Array.from(
    new Map(
      workspaces.map((ws) => [ws.projectId, {projectId: ws.projectId, apiHost: ws.apiHost}]),
    ).values(),
  )

  // Fetch all project apps in parallel using the cache and find the best match (longest URL)
  const allAppsArrays = await Promise.all(entities.map((e) => cache.get(e.projectId, e.apiHost)))

  const bestMatch = allAppsArrays.flat().reduce<UserApplication | undefined>((best, app) => {
    const appUrl = getAppUrl(app)
    if (appUrl && currentUrlMatchesApp(window.location, appUrl)) {
      const bestUrl = best ? getAppUrl(best) : ''
      return appUrl.length > bestUrl.length ? app : best
    }
    return best
  }, undefined)

  return bestMatch
}
