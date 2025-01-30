/* eslint-disable @typescript-eslint/no-shadow */
import {
  type ClientPerspective,
  type ContentSourceMap,
  createClient,
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
// import {createPreviewSecret} from '@sanity/preview-url-secret/create-secret'
import {memo, useDeferredValue, useEffect, useMemo, useState} from 'react'
import {
  type SanityClient,
  type SanityDocument,
  useClient,
  // useCurrentUser,
  useDataset,
  useProjectId,
} from 'sanity'
import {useEffectEvent} from 'use-effect-event'

// import {useEffectEvent} from 'use-effect-event'
import {API_VERSION, MIN_LOADER_QUERY_LISTEN_HEARTBEAT_INTERVAL} from '../constants'
import {
  type LiveQueriesState,
  type LiveQueriesStateValue,
  type LoaderConnection,
  type PresentationPerspective,
} from '../types'
import {type DocumentOnPage} from '../useDocumentsOnPage'
import {mapChangedValue, useQueryParams, useRevalidate} from './utils'

export interface LoaderQueriesProps {
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

export default function LoaderQueries(props: LoaderQueriesProps): React.JSX.Element {
  const {
    liveDocument: _liveDocument,
    controller,
    perspective: activePerspective,
    onLoadersConnection,
    onDocumentsOnPage,
  } = props

  const [comlink, setComlink] = useState<ChannelInstance<LoaderControllerMsg, LoaderNodeMsg>>()
  const [liveQueries, setLiveQueries] = useState<LiveQueriesState>({})

  const projectId = useProjectId()
  const dataset = useDataset()

  useEffect(() => {
    const interval = setInterval(
      () =>
        setLiveQueries((liveQueries) => {
          if (Object.keys(liveQueries).length < 1) {
            return liveQueries
          }

          const now = Date.now()
          const hasAnyExpired = Object.values(liveQueries).some(
            // eslint-disable-next-line max-nested-callbacks
            (liveQuery) =>
              liveQuery.heartbeat !== false && now > liveQuery.receivedAt + liveQuery.heartbeat,
          )
          if (!hasAnyExpired) {
            return liveQueries
          }
          const next = {} as LiveQueriesState
          for (const [key, value] of Object.entries(liveQueries)) {
            if (value.heartbeat !== false && now > value.receivedAt + value.heartbeat) {
              continue
            }
            next[key] = value
          }
          return next
        }),
      MIN_LOADER_QUERY_LISTEN_HEARTBEAT_INTERVAL,
    )
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (controller) {
      const comlink = controller.createChannel<LoaderControllerMsg, LoaderNodeMsg>(
        {
          name: 'presentation',
          connectTo: 'loaders',
          heartbeat: true,
        },
        createConnectionMachine<LoaderControllerMsg, LoaderNodeMsg>().provide({
          actors: createCompatibilityActors<LoaderControllerMsg>(),
        }),
      )
      setComlink(comlink)

      comlink.onStatus(onLoadersConnection)

      comlink.on('loader/documents', (data) => {
        if (data.projectId === projectId && data.dataset === dataset) {
          onDocumentsOnPage(
            'loaders',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data.perspective as unknown as any,
            data.documents,
          )
        }
      })

      comlink.on('loader/query-listen', (data) => {
        if (data.projectId === projectId && data.dataset === dataset) {
          if (
            typeof data.heartbeat === 'number' &&
            data.heartbeat < MIN_LOADER_QUERY_LISTEN_HEARTBEAT_INTERVAL
          ) {
            throw new Error(
              `Loader query listen heartbeat interval must be at least ${MIN_LOADER_QUERY_LISTEN_HEARTBEAT_INTERVAL}ms`,
            )
          }
          setLiveQueries((prev) => ({
            ...prev,
            [getQueryCacheKey(data.query, data.params)]: {
              perspective: data.perspective,
              query: data.query,
              params: data.params,
              receivedAt: Date.now(),
              heartbeat: data.heartbeat ?? false,
            } satisfies LiveQueriesStateValue,
          }))
        }
      })

      return comlink.start()
    }
    return undefined
  }, [controller, dataset, onDocumentsOnPage, onLoadersConnection, projectId])

  // const currentUser = useCurrentUser()
  // const handleCreatePreviewUrlSecret = useEffectEvent(
  //   async ({projectId, dataset}: {projectId: string; dataset: string}) => {
  //     try {
  //       // eslint-disable-next-line no-console
  //       console.log('Creating preview URL secret for ', {projectId, dataset})
  //       const {secret} = await createPreviewSecret(
  //         client,
  //         '@sanity/presentation',
  //         typeof window === 'undefined' ? '' : location.href,
  //         currentUser?.id,
  //       )
  //       return {secret}
  //     } catch (err) {
  //       // eslint-disable-next-line no-console
  //       console.error('Failed to generate preview URL secret', err)
  //       return {secret: null}
  //     }
  //   },
  // )
  // useEffect(() => {
  //   return comlink?.on('loader/fetch-preview-url-secret', (data) =>
  //     handleCreatePreviewUrlSecret(data),
  //   )
  // }, [comlink, handleCreatePreviewUrlSecret])

  const [syncTagsInUse] = useState(() => new Set<SyncTag[]>())
  const [lastLiveEventId, setLastLiveEventId] = useState<string | null>(null)
  const studioClient = useClient({apiVersion: API_VERSION})
  const clientConfig = useMemo(() => studioClient.config(), [studioClient])
  const client = useMemo(
    () =>
      studioClient.withConfig({
        resultSourceMap: 'withKeyArraySelector',
      }),
    [studioClient],
  )
  useEffect(() => {
    if (comlink) {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const {projectId, dataset} = clientConfig
      comlink.post('loader/perspective', {
        projectId: projectId!,
        dataset: dataset!,
        perspective: activePerspective,
      })
    }
  }, [comlink, clientConfig, activePerspective])

  const handleSyncTags = useEffectEvent((event: LiveEventMessage) => {
    const flattenedSyncTags = Array.from(syncTagsInUse).flat()
    const hasMatchingTags = event.tags.some((tag) => flattenedSyncTags.includes(tag))
    if (hasMatchingTags) {
      setLastLiveEventId(event.id)
    } else {
      // eslint-disable-next-line no-console
      console.log('No matching tags found', event.tags, {flattenedSyncTags})
    }
  })
  useEffect(() => {
    const liveClient = createClient(client.config()).withConfig({
      // Necessary for the live drafts to work
      apiVersion: 'vX',
    })
    const subscription = liveClient.live
      .events({includeDrafts: true, tag: 'presentation-loader'})
      .subscribe({
        next: (event) => {
          if (event.type === 'message') {
            handleSyncTags(event)
          } else if (event.type === 'restart') {
            setLastLiveEventId(event.id)
          } else if (event.type === 'reconnect') {
            setLastLiveEventId(null)
          }
        },
        // eslint-disable-next-line no-console
        error: (err) => console.error('Error validating EventSource URL:', err),
      })
    return () => subscription.unsubscribe()
  }, [client, handleSyncTags])

  /**
   * Defer the liveDocument to avoid unnecessary rerenders on rapid edits
   */
  const liveDocument = useDeferredValue(_liveDocument)

  return (
    <>
      {Object.entries(liveQueries).map(([key, {query, params, perspective}]) => (
        <QuerySubscription
          key={`${key}${perspective}`}
          projectId={clientConfig.projectId!}
          dataset={clientConfig.dataset!}
          perspective={perspective}
          query={query}
          params={params}
          comlink={comlink}
          client={client}
          liveDocument={liveDocument}
          lastLiveEventId={lastLiveEventId}
          syncTagsInUse={syncTagsInUse}
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
  extends Pick<UseQuerySubscriptionProps, 'client' | 'liveDocument' | 'lastLiveEventId'> {
  projectId: string
  dataset: string
  perspective: ClientPerspective
  query: string
  params: QueryParams
  comlink: LoaderConnection | undefined
  syncTagsInUse: Set<SyncTag[]>
}
function QuerySubscriptionComponent(props: QuerySubscriptionProps) {
  const {
    projectId,
    dataset,
    perspective,
    query,
    client,
    liveDocument,
    comlink,
    lastLiveEventId,
    syncTagsInUse,
  } = props

  const params = useQueryParams(props.params)
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
    lastLiveEventId,
  }) || {}

  const handleQueryChange = useEffectEvent(
    (
      comlink: LoaderConnection | undefined,
      perspective: ClientPerspective,
      query: string,
      params: QueryParams,
      result: unknown,
      resultSourceMap: ContentSourceMap | undefined,
      tags: `s1:${string}`[] | undefined,
      // eslint-disable-next-line max-params
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
  useEffect(() => {
    if (resultSourceMap) {
      handleQueryChange(comlink, perspective, query, params, result, resultSourceMap, tags)
    }
    if (Array.isArray(tags)) {
      syncTagsInUse.add(tags)
      return () => {
        syncTagsInUse.delete(tags)
      }
    }
    return undefined
  }, [
    comlink,
    handleQueryChange,
    params,
    perspective,
    query,
    result,
    resultSourceMap,
    syncTagsInUse,
    tags,
  ])

  return null
}
const QuerySubscription = memo(QuerySubscriptionComponent)
QuerySubscription.displayName = 'Memo(QuerySubscription)'

interface UseQuerySubscriptionProps extends Required<Pick<SharedProps, 'client'>> {
  liveDocument: Partial<SanityDocument> | null | undefined
  query: string
  params: QueryParams
  perspective: ClientPerspective
  lastLiveEventId: string | null
}
function useQuerySubscription(props: UseQuerySubscriptionProps) {
  const {liveDocument, client, query, params, perspective, lastLiveEventId} = props
  const [snapshot, setSnapshot] = useState<{
    result: unknown
    resultSourceMap?: ContentSourceMap
    syncTags?: SyncTag[]
    lastLiveEventId: string | null
  } | null>(null)
  // Make sure any async errors bubble up to the nearest error boundary
  const [error, setError] = useState<unknown>(null)
  if (error) throw error

  const [revalidate, startRefresh] = useRevalidate({
    // Refresh interval is set to zero as we're using the Live Draft Content API to revalidate queries
    refreshInterval: 0,
  })
  const shouldRefetch =
    revalidate === 'refresh' ||
    revalidate === 'inflight' ||
    lastLiveEventId !== snapshot?.lastLiveEventId
  useEffect(() => {
    if (!shouldRefetch) {
      return undefined
    }

    let fulfilled = false
    let fetching = false
    const controller = new AbortController()
    // eslint-disable-next-line no-inner-declarations
    async function effect() {
      const {signal} = controller
      fetching = true
      const {result, resultSourceMap, syncTags} = await client.fetch(query, params, {
        lastLiveEventId,
        tag: 'presentation-loader',
        signal,
        perspective,
        filterResponse: false,
        returnQuery: false,
      })
      fetching = false

      if (!signal.aborted) {
        setSnapshot((prev) => ({
          result: isEqual(prev?.result, result) ? prev?.result : result,
          resultSourceMap: isEqual(prev?.resultSourceMap, resultSourceMap)
            ? prev?.resultSourceMap
            : resultSourceMap,
          syncTags: isEqual(prev?.syncTags, syncTags) ? prev?.syncTags : syncTags,
          lastLiveEventId,
        }))
        fulfilled = true
      }
    }
    const onFinally = startRefresh()
    effect()
      .catch((error) => {
        fetching = false
        if (error.name !== 'AbortError') {
          setError(error)
        }
      })
      .finally(onFinally)
    return () => {
      if (!fulfilled && !fetching) {
        controller.abort()
      }
    }
  }, [client, lastLiveEventId, params, perspective, query, shouldRefetch, startRefresh])

  const {result, resultSourceMap, syncTags} = snapshot ?? {}
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

function getQueryCacheKey(query: string, params: QueryParams | string): `${string}-${string}` {
  return `${query}-${typeof params === 'string' ? params : JSON.stringify(params)}`
}
