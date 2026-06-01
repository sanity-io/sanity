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
    if (!userApplication || workspaces.length === 0) return undefined

    // Abort the in-flight upload on cleanup so StrictMode's double mount, or a dep change,
    // leaves only the latest upload running rather than racing duplicate requests.
    const controller = new AbortController()
    registerStudioManifest(userApplication, workspaces, theme, controller.signal).catch((error) => {
      if (error?.name === 'AbortError') return
      debug('Failed to upload studio manifest', error)
    })

    return () => controller.abort()
  }, [userApplication, workspaces, theme])

  return null
}
