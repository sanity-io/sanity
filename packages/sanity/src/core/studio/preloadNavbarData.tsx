import {useEffect} from 'react'
import {filter, type Subscription, take} from 'rxjs'

import {hasScheduledPublishingPlugin} from '../config/prepareConfig'
import {type WorkspaceSummary} from '../config/types'
import {preloadFeatures} from '../hooks/useFeatureEnabled'
import {preloadHasUsedScheduledPublishing} from '../scheduledPublishing/tool/contexts/useHasUsedScheduledPublishing'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../studioClient'
import {useActiveWorkspace} from './activeWorkspaceMatcher/useActiveWorkspace'

/**
 * Sends the requests the navbar's tool menu suspends on, the `/features` check and the scheduled
 * publishing usage probe, as soon as the user is signed in. Otherwise they only start once the
 * plugin providers commit, after the authenticated studio, the workspace source and the plugins
 * have loaded, and the navbar waits a round trip for them. Both requests are cached for the
 * session, so the providers read these answers instead of sending their own.
 *
 * @internal
 */
export function preloadNavbarData(workspace: WorkspaceSummary): Subscription {
  return workspace.auth.state
    .pipe(
      filter((state) => state.authenticated),
      take(1),
    )
    .subscribe(({client}) => {
      const versionedClient = client.withConfig(DEFAULT_STUDIO_CLIENT_OPTIONS)
      preloadFeatures({projectId: workspace.projectId, versionedClient})
      // A workspace that opted in explicitly counts as used without probing
      if (
        hasScheduledPublishingPlugin(workspace) &&
        !workspace.scheduledPublishing.__internal__workspaceEnabled
      ) {
        preloadHasUsedScheduledPublishing(versionedClient)
      }
    })
}

/**
 * Mount where the tree only renders for a signed-in user, outside the boundary of the lazily
 * loaded authenticated studio; renders nothing.
 *
 * @internal
 */
export function PreloadNavbarData(): null {
  const {activeWorkspace} = useActiveWorkspace()

  useEffect(() => {
    const subscription = preloadNavbarData(activeWorkspace)
    return () => subscription.unsubscribe()
  }, [activeWorkspace])

  return null
}
