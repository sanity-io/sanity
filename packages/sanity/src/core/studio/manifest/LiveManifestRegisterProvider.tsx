import {useRootTheme} from '@sanity/ui'
import {useEffect} from 'react'

import {useClient} from '../../hooks/useClient'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {useLiveUserApplication} from '../liveUserApplication/useLiveUserApplication'
import {useWorkspaces} from '../workspaces'
import {registerStudioManifest} from './registerLiveStudioManifest'

/**
 * Provider that automatically uploads the studio manifest when the Studio loads.
 * This runs once when all workspaces are available and includes all workspace information.
 *
 * @internal
 */
export function LiveManifestRegisterProvider() {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const workspaces = useWorkspaces()
  const {userApplication} = useLiveUserApplication()
  const {theme} = useRootTheme()

  useEffect(() => {
    if (!userApplication || workspaces.length === 0) {
      // Nothing to register
      return
    }
    // Upload once when workspaces are available
    registerStudioManifest(client, userApplication, workspaces, theme).catch((err) => {
      console.error('Failed to upload studio manifest', err)
    })
  }, [client, userApplication, workspaces, theme])

  return null
}
