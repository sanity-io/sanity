import {useRootTheme} from '@sanity/ui'
import debugit from 'debug'
import {useEffect} from 'react'

import {useLiveUserApplication} from '../liveUserApplication/useLiveUserApplication'
import {useWorkspaces} from '../workspaces'
import {registerStudioManifest} from './registerLiveStudioManifest'

const debug = debugit('sanity:manifest')

/**
 * Provider that automatically uploads the studio manifest when the Studio loads.
 * This runs once when all workspaces are available and includes all workspace information.
 *
 * @internal
 */
export function LiveManifestRegisterProvider() {
  const workspaces = useWorkspaces()
  const {userApplication} = useLiveUserApplication()
  const {theme} = useRootTheme()

  useEffect(() => {
    if (!userApplication || workspaces.length === 0) {
      // Nothing to register
      return
    }
    // Upload once when workspaces are available
    registerStudioManifest(userApplication, workspaces, theme).catch((err) => {
      debug('Failed to upload studio manifest', err)
    })
  }, [userApplication, workspaces, theme])

  return null
}
