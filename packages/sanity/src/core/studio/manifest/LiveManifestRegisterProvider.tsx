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

  useEffect(() => {
    if (!userApplication || workspaces.length === 0) {
      // Nothing to register
      return
    }
    // Upload once when workspaces are available
    registerStudioManifest(userApplication, workspaces).catch((err) => {
      debug('Failed to upload studio manifest', err)
    })
  }, [userApplication, workspaces])

  return null
}
