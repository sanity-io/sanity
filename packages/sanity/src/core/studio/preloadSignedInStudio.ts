import {type Subscription} from 'rxjs'
import {take} from 'rxjs/operators'

import {preloadWorkspaceSourceResolver} from '../config/prepareConfig'
import {type WorkspaceSummary} from '../config/types'
import {studioLocaleNamespace} from '../i18n/localeNamespaces'
import {hasSessionHint} from '../store/auth/legacy/createLegacyAuthStore'
import {preloadStudioShell} from './preloadStudioShell'

/** @internal */
export function importAuthenticatedStudio() {
  return import('./AuthenticatedStudio')
}

function isWorkspacePath(basePath: string, pathname: string): boolean {
  return basePath === '/' || pathname === basePath || pathname.startsWith(`${basePath}/`)
}

/**
 * Starts everything a signed-in visit waits for before the studio shell renders, when the store
 * of the workspace the URL points at has a session: the workspace's translations, the
 * `/users/me` probe, the authenticated tree, the workspace source resolver and the layout and
 * navbar chunks. Otherwise each of them only starts once the previous one has answered and
 * rendered.
 *
 * The translations go first. Every studio string waits for them, and a slow connection fetches
 * chunks in the order they were requested, so behind the navbar's chunks they would arrive last.
 *
 * The workspace is picked from the pathname alone, before the router has matched it, so a
 * studio with several workspaces may warm up a different one than it then shows. That only costs
 * a request: everything else is shared.
 *
 * Returns the subscription that keeps the probe running until it answers, so the auth boundary
 * mounting after it shares the request instead of starting another.
 *
 * @internal
 */
export function preloadSignedInStudio(
  workspaces: WorkspaceSummary[],
  pathname: string,
): Subscription | undefined {
  const workspace =
    workspaces.find(({basePath}) => isWorkspacePath(basePath, pathname)) ?? workspaces[0]
  if (!workspace || !hasSessionHint(workspace.auth)) return undefined

  void workspace.i18n.loadNamespaces([studioLocaleNamespace])
  void importAuthenticatedStudio()
  preloadWorkspaceSourceResolver()
  preloadStudioShell()

  // An error reaches the auth boundary through its own subscription.
  return workspace.auth.state.pipe(take(1)).subscribe({error: () => {}})
}
