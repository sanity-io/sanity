import {useRootTheme} from '@sanity/ui'
import {createDebug} from 'obug'
import {useEffect} from 'react'

import {useLiveUserApplication} from '../liveUserApplication/useLiveUserApplication'
import {useWorkspaces} from '../workspaces/useWorkspaces'

const debug = createDebug('sanity:manifest')

// Generating the manifest renders every workspace icon to markup (`react-dom/server`), and only a
// studio deployed as a user application uploads one, so the code loads when there is one
const loadRegisterStudioManifest = () => import('./registerLiveStudioManifest.lazy')

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
    loadRegisterStudioManifest()
      .then(({default: registerStudioManifest}) => {
        if (controller.signal.aborted) return undefined
        return registerStudioManifest(userApplication, workspaces, theme, controller.signal)
      })
      .catch((error) => {
        if (error?.name === 'AbortError') return
        debug('Failed to upload studio manifest', error)
      })

    return () => controller.abort()
  }, [userApplication, workspaces, theme])

  return null
}
