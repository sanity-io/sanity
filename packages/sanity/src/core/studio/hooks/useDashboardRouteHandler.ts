import {useNavigate} from '@sanity/sdk-react/dashboard'
import {useEffect} from 'react'
import {useRouter} from 'sanity/router'

import {useRenderingContextStore} from '../../store/datastores'
import {useRouterHistory} from '../router/RouterHistoryContext'

/**
 * Keeps Studio's route in sync with its dashboard host:
 * - over Comlink, it follows the host's navigations, and the bridge reports Studio's own
 * - over the message bus, it follows the host's navigations and reports Studio's own
 *
 * @internal
 */
export function useDashboardRouteHandler(): void {
  const history = useRouterHistory()
  const {navigateUrl} = useRouter()
  const isMessageBusHost = useRenderingContextStore().getCapabilities()?.messageBus === true

  const reportNavigation = useNavigate(({path}) => {
    if (!isMessageBusHost) {
      navigateUrl({path: sanitizePath(path), replace: false})
      return
    }
    // The host has already pushed its URL onto the browser history it shares with Studio.
    const {pathname, search, hash} = window.location
    const hostUrl = `${pathname}${search}${hash}`
    const studioUrl = `${history.location.pathname}${history.location.search}${history.location.hash}`
    if (hostUrl !== studioUrl) navigateUrl({path: hostUrl, replace: true})
  })

  useEffect(() => {
    if (!isMessageBusHost) return undefined
    // Studio has already pushed its entry, so the host replaces its URL rather than pushing again.
    const report = () => {
      const {pathname, search, hash} = history.location
      reportNavigation({path: `${pathname}${search}${hash}`, type: 'replace', scope: 'dashboard'})
    }
    report()
    return history.listen(report)
  }, [history, isMessageBusHost, reportNavigation])
}

/**
 * Ensure no more than one `/` character occurs at the beginning of the provided string.
 */
function sanitizePath(path: string): string {
  return path.replace(/^\/+/, '/')
}
