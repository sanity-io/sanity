import {useToast} from '@sanity/ui/toast'
import {useSelector} from '@xstate/react'
import {useEffect, useMemo} from 'react'
import {useClient, useTranslation} from 'sanity'

import {visionLocaleNamespace} from '../../i18n'
import {type QueryRunnerRef} from '../store/queryRunnerMachine'
import {LIVE_EVENTS_API_VERSION} from '../util/syncTags'

interface LiveSubscriptionOptions {
  runnerRef: QueryRunnerRef
  /** Live events are per dataset, so the subscription follows the tab's dataset */
  dataset: string
  /** Whether the tab wants live refetching and its API version supports sync tags */
  enabled: boolean
  /** Scopes the error toast to the tab */
  tabId: string
}

/**
 * Keeps the runner's live-events subscription in sync with the tab: on while the shown tab
 * refetches automatically (and its API version returns sync tags), off otherwise. Reports
 * subscription failures through a toast.
 */
export function useLiveSubscription({
  runnerRef,
  dataset,
  enabled,
  tabId,
}: LiveSubscriptionOptions): void {
  const {t} = useTranslation(visionLocaleNamespace)
  const toast = useToast()
  const liveError = useSelector(runnerRef, (snapshot) => snapshot.context.liveError)

  const baseClient = useClient({apiVersion: LIVE_EVENTS_API_VERSION})
  const liveClient = useMemo(() => baseClient.withConfig({dataset}), [baseClient, dataset])

  useEffect(() => {
    if (enabled) {
      runnerRef.send({type: 'live.enable', client: liveClient})
    } else {
      runnerRef.send({type: 'live.disable'})
    }
    // Only the active tab mounts this hook, so leaving the tab ends its subscription too
    return () => {
      // Closing the tab already stopped its runner, and a stopped actor takes no events
      if (runnerRef.getSnapshot().status === 'active') {
        runnerRef.send({type: 'live.disable'})
      }
    }
  }, [enabled, liveClient, runnerRef])

  useEffect(() => {
    if (liveError) {
      toast.push({
        closable: true,
        id: `vista-live-error-${tabId}`,
        status: 'warning',
        title: t('vista.live.error', {message: liveError.message}),
      })
    }
  }, [liveError, t, tabId, toast])
}
