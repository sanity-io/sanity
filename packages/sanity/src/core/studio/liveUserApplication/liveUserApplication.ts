import {firstValueFrom} from 'rxjs'

import {type WorkspaceSummary} from '../../config/types'
import {type UserApplication, type UserApplicationCache} from '../../store/userApplications'

function getAppUrl(app: UserApplication, internalHost: string): string {
  if (app.urlType === 'internal') {
    return `https://${app.appHost}.${internalHost}`
  }

  return app.appHost
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
  // Ensure we are running in a browser context
  if (typeof window === 'undefined' || !window.location) {
    return undefined
  }

  if (workspaces.length === 0) {
    return undefined
  }

  // If we are guessing the user application, we only check the first workspace. This makes
  // it easier to explain to end users and provides motivation for users to adopt using `sanity deploy`
  // In the future we will refactor this to prefer using the user application configured in the CLI.
  // Note: we don't do this today since we don't know the project id the user application is associated with and CORS.
  const workspace = workspaces[0]
  const state = await firstValueFrom(workspace.auth.state)
  if (!state.authenticated) {
    return undefined
  }

  let internalHost = 'sanity.studio'
  if (workspace.apiHost !== undefined && workspace.apiHost.includes('sanity.work')) {
    internalHost = 'studio.sanity.work'
  }

  const userApplications = await cache.get(state.client)
  const bestMatch = userApplications.reduce<[UserApplication | undefined, string]>(
    (best, app) => {
      const appUrl = getAppUrl(app, internalHost)
      if (
        appUrl &&
        currentUrlMatchesApp(window.location, appUrl) &&
        appUrl.length > best[1].length
      ) {
        return [app, appUrl]
      }
      return best
    },
    [undefined, ''],
  )

  return bestMatch[0]
}
