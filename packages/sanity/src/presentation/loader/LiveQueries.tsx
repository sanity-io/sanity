import {
  type ClientPerspective,
  type ContentSourceMap,
  type LiveEventMessage,
  type QueryParams,
  type SyncTag,
} from '@sanity/client'
import {applySourceDocuments, getPublishedId} from '@sanity/client/csm'
import {
  type ChannelInstance,
  type Controller,
  createConnectionMachine,
  type StatusEvent,
} from '@sanity/comlink'
import {
  createCompatibilityActors,
  type LoaderControllerMsg,
  type LoaderNodeMsg,
} from '@sanity/presentation-comlink'
import isEqual from 'fast-deep-equal'
import {memo, startTransition, useDeferredValue, useEffect, useMemo, useState} from 'react'
import {
  isReleasePerspective,
  RELEASES_STUDIO_CLIENT_OPTIONS,
  type SanityClient,
  type SanityDocument,
  useClient,
  useDataset,
  useProjectId,
} from 'sanity'
import {useEffectEvent} from 'use-effect-event'

import {API_VERSION, MIN_LOADER_QUERY_LISTEN_HEARTBEAT_INTERVAL} from '../constants'
import {type LoaderConnection, type PresentationPerspective} from '../types'
import {type DocumentOnPage} from '../useDocumentsOnPage'
import {useLiveEvents} from './useLiveEvents'
import {useLiveQueries} from './useLiveQueries'
import {mapChangedValue} from './utils'

export interface LiveQueriesProps {
  liveDocument: Partial<SanityDocument> | null | undefined
  controller: Controller | undefined
  perspective: ClientPerspective
  onLoadersConnection: (event: StatusEvent) => void
  onDocumentsOnPage: (
    key: string,
    perspective: PresentationPerspective,
    state: DocumentOnPage[],
  ) => void
}

export default function LiveQueries(props: LiveQueriesProps): React.JSX.Element {
  const {controller, perspective: activePerspective, onLoadersConnection, onDocumentsOnPage} = props

  const [comlink, setComlink] = useState<ChannelInstance<LoaderControllerMsg, LoaderNodeMsg>>()
  const [liveQueries, liveQueriesDispatch] = useLiveQueries()

  const projectId = useProjectId()
  const dataset = useDataset()

  useEffect((): (() => void) => {
    if (controller) {
      const nextComlink = controller.createChannel<LoaderControllerMsg, LoaderNodeMsg>(
        {
          name: 'presentation',
          connectTo: 'loaders',
          heartbeat: true,
        },
        createConnectionMachine<LoaderControllerMsg, LoaderNodeMsg>().provide({
          actors: createCompatibilityActors<LoaderControllerMsg>(),
        }),
      )
      setComlink(nextComlink)

      nextComlink.onStatus(onLoadersConnection)

      nextComlink.on('loader/documents', (data) => {
        if (data.projectId === projectId && data.dataset === dataset) {
          onDocumentsOnPage(
            'loaders',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data.perspective as unknown as any,
            data.documents,
          )
        }
      })

      nextComlink.on('loader/query-listen', (data) => {
        if (data.projectId === projectId && data.dataset === dataset) {
          if (
            typeof data.heartbeat === 'number' &&
            data.heartbeat < MIN_LOADER_QUERY_LISTEN_HEARTBEAT_INTERVAL
          ) {
            throw new Error(
              `Loader query listen heartbeat interval must be at least ${MIN_LOADER_QUERY_LISTEN_HEARTBEAT_INTERVAL}ms`,
            )
          }
          liveQueriesDispatch({
            type: 'query-listen',
            payload: {
              perspective: data.perspective,
              query: data.query,
              params: data.params,
              heartbeat: data.heartbeat ?? false,
            },
          })
        }
      })

      return nextComlink.start()
    }
    return () => undefined
  }, [controller, dataset, liveQueriesDispatch, onDocumentsOnPage, onLoadersConnection, projectId])

  const studioClient = useClient(
    isReleasePerspective(activePerspective)
      ? RELEASES_STUDIO_CLIENT_OPTIONS
      : {apiVersion: API_VERSION},
  )
  const client = useMemo(
    () =>
      studioClient.withConfig({
        resultSourceMap: 'withKeyArraySelector',
      }),
    [studioClient],
  )
  useEffect(() => {
    if (comlink) {
      comlink.post('loader/perspective', {
        projectId,
        dataset,
        perspective: activePerspective,
      })
    }
  }, [comlink, activePerspective, projectId, dataset])

  /**
   * Defer the liveDocument to avoid unnecessary rerenders on rapid edits
   */
  const liveDocument = useDeferredValue(props.liveDocument)

  const liveEvents = useLiveEvents(client)

  return (
    <>
      {[...liveQueries.entries()].map(([key, {query, params, perspective}]) => (
        <QuerySubscription
          key={`${liveEvents.resets}:${key}`}
          projectId={projectId}
          dataset={dataset}
          perspective={perspective}
          query={query}
          params={params}
          comlink={comlink}
          client={client}
          liveDocument={liveDocument}
          liveEventsMessages={liveEvents.messages}
        />
      ))}
    </>
  )
}

interface SharedProps {
  /**
   * The Sanity client to use for fetching data and listening to mutations.
   */
  client: SanityClient
}

interface QuerySubscriptionProps
  extends Pick<UseQuerySubscriptionProps, 'client' | 'liveDocument' | 'liveEventsMessages'> {
  projectId: string
  dataset: string
  perspective: ClientPerspective
  query: string
  params: QueryParams
  comlink: LoaderConnection | undefined
}
function QuerySubscriptionComponent(props: QuerySubscriptionProps) {
  const {
    projectId,
    dataset,
    perspective,
    query,
    client,
    liveDocument,
    params,
    comlink,
    liveEventsMessages,
  } = props

  const {
    result,
    resultSourceMap,
    syncTags: tags,
  } = useQuerySubscription({
    client,
    liveDocument,
    params,
    perspective,
    query,
    liveEventsMessages,
  }) || {}

  /* eslint-disable @typescript-eslint/no-shadow,max-params */
  const handleQueryChange = useEffectEvent(
    (
      comlink: LoaderConnection | undefined,
      perspective: ClientPerspective,
      query: string,
      params: QueryParams,
      result: unknown,
      resultSourceMap: ContentSourceMap | undefined,
      tags: `s1:${string}`[] | undefined,
    ) => {
      comlink?.post('loader/query-change', {
        projectId,
        dataset,
        perspective,
        query,
        params,
        result,
        resultSourceMap,
        tags,
      })
    },
  )
  /* eslint-enable @typescript-eslint/no-shadow,max-params */

  useEffect(() => {
    if (resultSourceMap) {
      handleQueryChange(comlink, perspective, query, params, result, resultSourceMap, tags)
    }
    return undefined
  }, [comlink, params, perspective, query, result, resultSourceMap, tags])

  return null
}
const QuerySubscription = memo(QuerySubscriptionComponent)
QuerySubscription.displayName = 'Memo(QuerySubscription)'

interface UseQuerySubscriptionProps extends Required<Pick<SharedProps, 'client'>> {
  liveDocument: Partial<SanityDocument> | null | undefined
  query: string
  params: QueryParams
  perspective: ClientPerspective
  liveEventsMessages: LiveEventMessage[]
}
function useQuerySubscription(props: UseQuerySubscriptionProps) {
  const {liveDocument, client, query, params, perspective, liveEventsMessages} = props
  const [result, setResult] = useState<unknown>(null)
  const [resultSourceMap, setResultSourceMap] = useState<ContentSourceMap | null | undefined>(null)
  const [syncTags, setSyncTags] = useState<SyncTag[] | undefined>(undefined)
  const [skipEventIds] = useState(() => new Set(liveEventsMessages.map((msg) => msg.id)))
  const recentLiveEvents = liveEventsMessages.filter((msg) => !skipEventIds.has(msg.id))
  const lastLiveEvent = recentLiveEvents.findLast((msg) =>
    msg.tags.some((tag) => syncTags?.includes(tag)),
  )
  const lastLiveEventId = lastLiveEvent?.id

  // Make sure any async errors bubble up to the nearest error boundary
  const [error, setError] = useState<unknown>(null)
  if (error) throw error

  /* eslint-disable max-nested-callbacks */
  useEffect(() => {
    const controller = new AbortController()

    client
      .fetch(query, params, {
        lastLiveEventId,
        tag: 'presentation-loader',
        signal: controller.signal,
        perspective,
        filterResponse: false,
        returnQuery: false,
      })
      .then((response) => {
        startTransition(() => {
          // eslint-disable-next-line max-nested-callbacks
          setResult((prev: unknown) => (isEqual(prev, response.result) ? prev : response.result))
          setResultSourceMap((prev) =>
            isEqual(prev, response.resultSourceMap) ? prev : response.resultSourceMap,
          )
          setSyncTags((prev) => (isEqual(prev, response.syncTags) ? prev : response.syncTags))
        })
      })
      .catch((err) => {
        if (typeof err !== 'object' || err?.name !== 'AbortError') {
          setError(err)
        }
      })

    return () => {
      controller.abort()
    }
  }, [client, lastLiveEventId, params, perspective, query])
  /* eslint-enable max-nested-callbacks */

  return useMemo(() => {
    if (liveDocument && resultSourceMap) {
      return {
        result: turboChargeResultIfSourceMap(liveDocument, result, perspective, resultSourceMap),
        resultSourceMap,
        syncTags,
      }
    }
    return {result, resultSourceMap, syncTags}
  }, [liveDocument, perspective, result, resultSourceMap, syncTags])
}

export function turboChargeResultIfSourceMap<T = unknown>(
  liveDocument: Partial<SanityDocument> | null | undefined,
  result: T,
  perspective: ClientPerspective,
  resultSourceMap?: ContentSourceMap,
): T {
  if (perspective === 'raw') {
    throw new Error('turboChargeResultIfSourceMap does not support raw perspective')
  }
  return applySourceDocuments(
    result,
    resultSourceMap,
    (sourceDocument) => {
      // If there's a displayed document, always prefer it
      if (
        // If _projectId is set, it's a cross dataset reference and we should skip it
        !sourceDocument._projectId &&
        liveDocument?._id &&
        getPublishedId(liveDocument._id) === getPublishedId(sourceDocument._id)
      ) {
        if (typeof liveDocument._id === 'string' && typeof sourceDocument._type === 'string') {
          return liveDocument as unknown as Required<Pick<SanityDocument, '_id' | '_type'>>
        }
        return {
          ...liveDocument,
          _id: liveDocument._id || sourceDocument._id,
          _type: liveDocument._type || sourceDocument._type,
        }
      }
      return null
    },
    mapChangedValue,
    perspective,
  )
}
