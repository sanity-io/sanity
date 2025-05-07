import {type PathChangeMessage} from '@sanity/message-protocol'
import {useEffect} from 'react'

import {useComlinkStore} from '../../store/_legacy/datastores'
import {useRouterHistory} from '../router/RouterHistoryContext'

/**
 * Perform a navigation when a Comlink `dashboard/v1/history/change-path` event is emitted.
 *
 * Note: this subscription cannot be colocated with the router code because it must retrieve the Comlink store from the Resource Cache, which is rendered beneath the router provider.
 */
export function useComlinkRouteHandler(): void {
  const {node} = useComlinkStore()
  const history = useRouterHistory()

  useEffect(() => {
    return node?.on<PathChangeMessage['type'], PathChangeMessage>(
      'dashboard/v1/history/change-path',
      ({path}) => {
        history.push(relativePath(path))
        return undefined
      },
    )
  }, [history, node])
}

/**
 * Remove all `/` characters that occur at the beginning of the provided string.
 */
function relativePath(path: string): string {
  return path.replace(/^\/+/, '')
}
