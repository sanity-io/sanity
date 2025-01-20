import {
  type ClientConfig,
  type ClientPerspective,
  type ContentSourceMap,
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
import {applyPatch} from 'mendoza'
import LRUCache from 'mnemonist/lru-cache-with-delete'
import {memo, useEffect, useMemo, useState} from 'react'
import {
  type SanityClient,
  type SanityDocument,
  useClient,
  // useCurrentUser,
  useDataset,
  useProjectId,
} from 'sanity'

import {
  LIVE_QUERY_CACHE_BATCH_SIZE,
  LIVE_QUERY_CACHE_SIZE,
  MIN_LOADER_QUERY_LISTEN_HEARTBEAT_INTERVAL,
} from '../constants'
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
  documentsOnPage: {_id: string; _type: string}[]
  onLoadersConnection: (event: StatusEvent) => void
  onDocumentsOnPage: (
    key: string,
    perspective: PresentationPerspective,
    state: DocumentOnPage[],
  ) => void
}

export default function LoaderQueries(props: LoaderQueriesProps): React.JSX.Element {
  const {
    liveDocument,
    controller,
    perspective: activePerspective,
    documentsOnPage,
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
        // eslint-disable-next-line @typescript-eslint/no-shadow
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
      // eslint-disable-next-line @typescript-eslint/no-shadow
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
        // data is not presenting the correct perspective
        // eg moving from previewDrafts -> published
        // data.perspective will be previewDrafts
        // despite props.perspective being published
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

  const [cache] = useState(() => new LRUCache<string, SanityDocument>(LIVE_QUERY_CACHE_SIZE))
  const studioClient = useClient({apiVersion: '2023-10-16'})
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

  const turboIds = useMemo(() => {
    const documentsActuallyInUse = documentsOnPage.map(({_id}) => _id)
    const set = new Set(documentsActuallyInUse)
    const ids = [...set]
    const max = cache.capacity
    if (ids.length >= max) {
      ids.length = max
    }
    return ids
  }, [cache.capacity, documentsOnPage])

  const [documentsCacheLastUpdated, setDocumentsCacheLastUpdated] = useState(0)

  return (
    <>
      <Turbo
        cache={cache}
        client={client}
        turboIds={turboIds}
        setDocumentsCacheLastUpdated={setDocumentsCacheLastUpdated}
      />
      {Object.entries(liveQueries).map(([key, {query, params, perspective}]) => (
        <QuerySubscription
          key={`${key}${perspective}`}
          cache={cache}
          projectId={clientConfig.projectId!}
          dataset={clientConfig.dataset!}
          perspective={perspective}
          query={query}
          params={params}
          comlink={comlink}
          client={client}
          refreshInterval={activePerspective ? 2000 : 0}
          liveDocument={liveDocument}
          documentsCacheLastUpdated={documentsCacheLastUpdated}
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
  /**
   * How frequently queries should be refetched in the background to refresh the parts of queries that can't be source mapped.
   * Setting it to `0` will disable background refresh.
   * @defaultValue 10000
   */
  refreshInterval?: number
  /**
   * The documents cache to use for turbo-charging queries.
   */
  cache: LRUCache<string, SanityDocument>
}

interface TurboProps extends Pick<SharedProps, 'client' | 'cache'> {
  turboIds: string[]
  setDocumentsCacheLastUpdated: (timestamp: number) => void
}
/**
 * A turbo-charged mutation observer that uses Content Source Maps to apply mendoza patches on your queries
 */
const Turbo = memo(function Turbo(props: TurboProps) {
  const {cache, client, turboIds, setDocumentsCacheLastUpdated} = props
  // Figure out which documents are missing from the cache
  const [batch, setBatch] = useState<string[][]>([])
  useEffect(() => {
    const batchSet = new Set(batch.flat())
    const nextBatch = new Set<string>()
    for (const turboId of turboIds) {
      if (!batchSet.has(turboId) && !cache.has(turboId)) {
        nextBatch.add(turboId)
      }
    }
    const nextBatchSlice = [...nextBatch].slice(0, LIVE_QUERY_CACHE_BATCH_SIZE)
    if (nextBatchSlice.length === 0) return undefined
    const raf = requestAnimationFrame(() =>
      // eslint-disable-next-line max-nested-callbacks
      setBatch((prevBatch) => [...prevBatch.slice(-LIVE_QUERY_CACHE_BATCH_SIZE), nextBatchSlice]),
    )
    return () => cancelAnimationFrame(raf)
  }, [batch, cache, turboIds])

  // Use the same listen instance and patch documents as they come in
  useEffect(() => {
    const subscription = client
      .listen(
        '*',
        {},
        {
          events: ['mutation'],
          effectFormat: 'mendoza',
          includePreviousRevision: false,
          includeResult: false,
          tag: 'presentation-loader',
        },
      )
      .subscribe((update) => {
        if (update.type === 'mutation' && update.transition === 'disappear') {
          if (cache.delete(update.documentId)) {
            setDocumentsCacheLastUpdated(Date.now())
          }
        }

        if (update.type !== 'mutation' || !update.effects?.apply?.length) return
        // Schedule a reach state update with the ID of the document that were mutated
        // This react handler will apply the document to related source map snapshots
        const cachedDocument = cache.peek(update.documentId)
        if (cachedDocument as SanityDocument) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const patchDoc = {...cachedDocument} as any
          delete patchDoc._rev
          const patchedDocument = applyPatch(patchDoc, update.effects.apply)
          cache.set(update.documentId, patchedDocument)
          setDocumentsCacheLastUpdated(Date.now())
        }
      })
    return () => subscription.unsubscribe()
  }, [cache, client, setDocumentsCacheLastUpdated])

  return (
    <>
      {batch.map((ids) => (
        <GetDocuments
          key={JSON.stringify(ids)}
          cache={cache}
          client={client}
          ids={ids}
          setDocumentsCacheLastUpdated={setDocumentsCacheLastUpdated}
        />
      ))}
    </>
  )
})

interface GetDocumentsProps extends Pick<SharedProps, 'client' | 'cache'> {
  ids: string[]
  setDocumentsCacheLastUpdated: (timestamp: number) => void
}
const GetDocuments = memo(function GetDocuments(props: GetDocumentsProps) {
  const {client, cache, ids, setDocumentsCacheLastUpdated} = props

  useEffect(() => {
    const missingIds = ids.filter((id) => !cache.has(id))
    if (missingIds.length === 0) return
    client.getDocuments(missingIds).then((documents) => {
      for (const doc of documents) {
        if (doc && doc?._id) {
          cache.set(doc._id, doc)
          setDocumentsCacheLastUpdated(Date.now())
        }
      }
      // eslint-disable-next-line no-console
    }, console.error)
  }, [cache, client, ids, setDocumentsCacheLastUpdated])

  return null
})
GetDocuments.displayName = 'GetDocuments'

interface QuerySubscriptionProps
  extends Pick<
    UseQuerySubscriptionProps,
    'client' | 'cache' | 'refreshInterval' | 'liveDocument' | 'documentsCacheLastUpdated'
  > {
  projectId: string
  dataset: string
  perspective: ClientPerspective
  query: string
  params: QueryParams
  comlink: LoaderConnection | undefined
}
function QuerySubscription(props: QuerySubscriptionProps) {
  const {
    cache,
    projectId,
    dataset,
    perspective,
    query,
    client,
    refreshInterval,
    liveDocument,
    comlink,
    documentsCacheLastUpdated,
  } = props

  const params = useQueryParams(props.params)
  const data = useQuerySubscription({
    cache,
    client,
    liveDocument,
    params,
    perspective,
    query,
    refreshInterval,
    documentsCacheLastUpdated,
  })
  const result = data?.result
  const resultSourceMap = data?.resultSourceMap
  const tags = data?.tags

  useEffect(() => {
    if (resultSourceMap) {
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
    }
  }, [comlink, dataset, params, perspective, projectId, query, result, resultSourceMap, tags])

  return null
}

interface UseQuerySubscriptionProps
  extends Required<Pick<SharedProps, 'client' | 'refreshInterval' | 'cache'>> {
  liveDocument: Partial<SanityDocument> | null | undefined
  query: string
  params: QueryParams
  perspective: ClientPerspective
  documentsCacheLastUpdated: number
}
function useQuerySubscription(props: UseQuerySubscriptionProps) {
  const {
    cache,
    liveDocument,
    client,
    refreshInterval,
    query,
    params,
    perspective,
    documentsCacheLastUpdated,
  } = props
  const [snapshot, setSnapshot] = useState<{
    result: unknown
    resultSourceMap?: ContentSourceMap
    tags?: SyncTag[]
  } | null>(null)
  const {projectId, dataset} = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const {projectId, dataset} = client.config()
    return {projectId, dataset} as Required<Pick<ClientConfig, 'projectId' | 'dataset'>>
  }, [client])

  // Make sure any async errors bubble up to the nearest error boundary
  const [error, setError] = useState<unknown>(null)
  if (error) throw error

  const [revalidate, startRefresh] = useRevalidate({refreshInterval})
  const shouldRefetch = revalidate === 'refresh' || revalidate === 'inflight'
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
        tag: 'presentation-loader',
        signal,
        perspective,
        filterResponse: false,
      })
      fetching = false

      if (!signal.aborted) {
        setSnapshot({result, resultSourceMap, tags: syncTags})

        fulfilled = true
      }
    }
    const onFinally = startRefresh()
    effect()
      // eslint-disable-next-line @typescript-eslint/no-shadow
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
  }, [
    client,
    dataset,
    liveDocument,
    params,
    perspective,
    projectId,
    query,
    shouldRefetch,
    startRefresh,
  ])

  return useMemo(() => {
    if (documentsCacheLastUpdated && snapshot?.resultSourceMap) {
      return {
        result: turboChargeResultIfSourceMap(
          cache,
          liveDocument,
          snapshot.result,
          perspective,
          snapshot.resultSourceMap,
        ),
        resultSourceMap: snapshot.resultSourceMap,
      }
    }
    return snapshot
  }, [cache, documentsCacheLastUpdated, liveDocument, perspective, snapshot])
}

let warnedAboutCrossDatasetReference = false
export function turboChargeResultIfSourceMap<T = unknown>(
  cache: SharedProps['cache'],
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
      if (sourceDocument._projectId) {
        // @TODO Handle cross dataset references
        if (!warnedAboutCrossDatasetReference) {
          // eslint-disable-next-line no-console
          console.warn(
            'Cross dataset references are not supported yet, ignoring source document',
            sourceDocument,
          )
          warnedAboutCrossDatasetReference = true
        }
        return undefined
      }
      // If there's a displayed document, always prefer it
      if (
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
      // Fallback to general documents cache
      return cache.get(sourceDocument._id)
    },
    mapChangedValue,
    perspective,
  )
}

function getQueryCacheKey(query: string, params: QueryParams | string): `${string}-${string}` {
  return `${query}-${typeof params === 'string' ? params : JSON.stringify(params)}`
}
