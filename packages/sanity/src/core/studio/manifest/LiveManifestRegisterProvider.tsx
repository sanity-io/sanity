import {useRootTheme} from '@sanity/ui'
import debugit from 'debug'
import {useEffect, useRef} from 'react'

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

  const lastUploadedRef =
    useRef<[typeof userApplication, typeof workspaces, typeof theme]>(undefined)

  useEffect(() => {
    if (!userApplication || workspaces.length === 0) return

    // Skip StrictMode's double-invoked mount effect, where every dep is referentially
    // identical, while still re-uploading whenever any dep genuinely changes.
    const previous = lastUploadedRef.current
    const unchanged =
      previous &&
      previous[0] === userApplication &&
      previous[1] === workspaces &&
      previous[2] === theme
    if (unchanged) return

    lastUploadedRef.current = [userApplication, workspaces, theme]
    registerStudioManifest(userApplication, workspaces, theme).catch((err) => {
      debug('Failed to upload studio manifest', err)
    })
  }, [userApplication, workspaces, theme])

  return null
}
