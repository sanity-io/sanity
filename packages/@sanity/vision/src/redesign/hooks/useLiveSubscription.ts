import {type SanityClient} from '@sanity/client'
import {useToast} from '@sanity/ui/toast'
import {useSelector} from '@xstate/react'
import {useEffect} from 'react'
import {useClient} from 'sanity'
import {useTranslation} from 'sanity/i18n'

import {visionLocaleNamespace} from '../../i18n'
import {type QueryRunnerRef} from '../store/queryRunnerMachine'
import {LIVE_EVENTS_API_VERSION} from '../util/syncTags'

const datasetClients = new WeakMap<SanityClient, Map<string, SanityClient>>()

/**
 * One client per dataset for as long as the base client lives: a remounted tab that hands the
 * runner the client it already has resumes its paused subscription instead of replacing it
 */
function getDatasetClient(baseClient: SanityClient, dataset: string): SanityClient {
  let clients = datasetClients.get(baseClient)
  if (!clients) {
    clients = new Map()
    datasetClients.set(baseClient, clients)
  }
  let client = clients.get(dataset)
  if (!client) {
    client = baseClient.withConfig({dataset})
    clients.set(dataset, client)
  }
  return client
}

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
 * Keeps the runner's live-events subscription in sync with the tab: on while the tab refetches
 * automatically (and its API version returns sync tags), off otherwise. Only the active tab is
 * mounted, so unmounting pauses the subscription: a background tab never refetches out of sight,
 * but it remembers relevant events and catches up with one refetch when it is shown again.
 * Reports subscription failures through a toast.
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
  const liveClient = getDatasetClient(baseClient, dataset)

  useEffect(() => {
    if (!enabled) {
      runnerRef.send({type: 'live.disable'})
      return undefined
    }
    runnerRef.send({type: 'live.enable', client: liveClient})
    return () => runnerRef.send({type: 'live.pause'})
  }, [enabled, liveClient, runnerRef])

  useEffect(() => {
    if (liveError) {
      toast.push({
        closable: true,
        id: `vision-live-error-${tabId}`,
        status: 'warning',
        title: t('vision.live.error', {message: liveError.message}),
      })
    }
  }, [liveError, t, tabId, toast])
}
