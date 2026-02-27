import {type PathChangeMessage} from '@sanity/message-protocol'
import {useEffect} from 'react'
import {useRouter} from 'sanity/router'

import {useComlinkStore} from '../../store/_legacy/datastores'

/**
 * Perform a navigation when a Comlink `dashboard/v1/history/change-path` event is emitted.
 *
 * Note: this subscription cannot be colocated with the router code because it must retrieve the Comlink store from the Resource Cache, which is rendered beneath the router provider.
 */
export function useComlinkRouteHandler(): void {
  const {node} = useComlinkStore()
  const {navigateUrl} = useRouter()

  useEffect(() => {
    return node?.on<PathChangeMessage['type'], PathChangeMessage>(
      'dashboard/v1/history/change-path',
      ({path}) => {
        navigateUrl({
          path: sanitizePath(path),
          replace: false,
        })
        return undefined
      },
    )
  }, [navigateUrl, node])
}

/**
 * Ensure no more than one `/` character occurs at the beginning of the provided string.
 */
function sanitizePath(path: string): string {
  return path.replace(/^\/+/, '/')
}
