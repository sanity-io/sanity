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
import {useDecideParameters} from '../useDecideParameters'
import {type DocumentOnPage} from '../useDocumentsOnPage'
import {useLiveEvents} from './useLiveEvents'
import {useLiveQueries} from './useLiveQueries'
import {mapChangedValue} from './utils'

// Conditional content resolution logic from client
interface DecideCondition {
  audience: string
  value: unknown
  [key: string]: unknown
}

interface DecideField {
  default: unknown
  conditions: DecideCondition[]
}

interface LocalDecideParameters {
  audience: string | string[]
  [key: string]: unknown
}

function isDecideField(value: unknown): value is DecideField {
  return (
    value != null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    'default' in value &&
    'conditions' in value &&
    Array.isArray((value as any).conditions)
  )
}

function resolveDecideField(field: DecideField, decideParameters?: LocalDecideParameters): unknown {
  const audience = decideParameters?.audience

  if (
    !decideParameters ||
    !audience ||
    (Array.isArray(audience) && audience.length === 0) ||
    audience === ''
  ) {
    return field.default
  }

  const matchingCondition = field.conditions.find((condition) => {
    return Array.isArray(audience)
      ? audience.includes(condition.audience)
      : condition.audience === audience
  })

  return matchingCondition ? matchingCondition.value : field.default
}

function processObjectRecursively(obj: unknown, decideParameters?: LocalDecideParameters): unknown {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => processObjectRecursively(item, decideParameters))
  }

  return Object.entries(obj).reduce<Record<string, unknown>>((processed, [key, value]) => {
    try {
      if (isDecideField(value)) {
        processed[key] = resolveDecideField(value, decideParameters)
      } else {
        processed[key] = processObjectRecursively(value, decideParameters)
      }
    } catch (error) {
      processed[key] = value
    }
    return processed
  }, {})
}

function processDecideFields(data: unknown, decideParameters?: LocalDecideParameters): unknown {
  try {
    return processObjectRecursively(data, decideParameters)
  } catch (error) {
    return data
  }
}

/**
 * Cleanses a value to be valid for use as a client tag.
 * Tag can only contain alphanumeric characters, underscores, dashes and dots,
 * and be between one and 75 characters long.
 */
function cleanseTag(input: string | string[] | undefined | null): string {
  if (!input) return 'unknown'

  // Convert array to string representation
  const stringValue = Array.isArray(input) ? input.join('-') : String(input)

  // Replace invalid characters with dashes, limit to 75 chars
  return (
    stringValue
      .replace(/[^a-zA-Z0-9_.-]/g, '-')
      .slice(0, 75)
      .replace(/^-+|-+$/g, '') || // Remove leading/trailing dashes
    'unknown'
  ) // Fallback if string becomes empty
}

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
  console.warn('[STUDIO-DECIDE] LiveQueries component mounted - our code is running!')

  const {controller, perspective: activePerspective, onLoadersConnection, onDocumentsOnPage} = props

  const [comlink, setComlink] = useState<ChannelInstance<LoaderControllerMsg, LoaderNodeMsg>>()
  const [liveQueries, liveQueriesDispatch] = useLiveQueries()
  const {decideParameters} = useDecideParameters()

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
            // oxlint-disable-next-line no-explicit-any
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
              decideParameters: data.decideParameters,
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

  // Post decide parameters to loaders when they change
  useEffect(() => {
    if (comlink) {
      comlink.post('loader/decide-parameters', {
        projectId,
        dataset,
        decideParameters: JSON.stringify(decideParameters),
      })
    }
  }, [comlink, decideParameters, projectId, dataset])

  /**
   * Defer the liveDocument to avoid unnecessary rerenders on rapid edits
   */
  const liveDocument = useDeferredValue(props.liveDocument)

  const liveEvents = useLiveEvents(client)

  return (
    <>
      {[...liveQueries.entries()].map(
        ([key, {query, params, perspective, decideParameters: queryDecideParameters}]) => (
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
            decideParameters={queryDecideParameters}
          />
        ),
      )}
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
  decideParameters?: string
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
    decideParameters,
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
    decideParameters,
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
      // Add diagnostic logging before sending to preview
      const resultStr = JSON.stringify(result)
      const hasConditionalContent = resultStr.includes('"conditions"')

      console.warn('[STUDIO-DECIDE] Sending to preview:', {
        hasConditionalContent,
        resultType: typeof result,
        resultSample: `${resultStr.slice(0, 200)}${resultStr.length > 200 ? '...' : ''}`,
      })

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
  decideParameters?: string
}
function useQuerySubscription(props: UseQuerySubscriptionProps) {
  const {
    liveDocument,
    client,
    query,
    params,
    perspective,
    liveEventsMessages,
    decideParameters: passedDecideParameters,
  } = props

  // Use passed decideParameters if provided, otherwise fall back to global context
  const {decideParameters: globalDecideParameters} = useDecideParameters()
  const decideParameters = passedDecideParameters
    ? (() => {
        try {
          return JSON.parse(passedDecideParameters)
        } catch {
          return globalDecideParameters
        }
      })()
    : globalDecideParameters

  // Transform decideParameters for both useEffect and useMemo to use
  const transformedDecideParameters: LocalDecideParameters | undefined = useMemo(() => {
    if (!decideParameters || typeof decideParameters !== 'object') return undefined

    const parsedParams =
      typeof decideParameters === 'string'
        ? (() => {
            try {
              return JSON.parse(decideParameters) as Record<string, string | string[]>
            } catch {
              return undefined
            }
          })()
        : (decideParameters as Record<string, string | string[]>)

    if (!parsedParams || Object.keys(parsedParams).length === 0) return undefined

    const audience = parsedParams.audiences ?? 'preview'
    if (!audience) return undefined

    return {
      ...parsedParams,
      audience,
    }
  }, [decideParameters])
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

    // Add diagnostic logging to trace decideParameters usage
    console.warn('[STUDIO-DECIDE] Executing query with decideParameters:', {
      query: `${query.slice(0, 50)}...`,
      decideParameters: transformedDecideParameters,
      hasConditionalFields: false, // Will be updated after response
    })

    client
      .fetch(query, params, {
        lastLiveEventId,
        tag: `presentation-loader-${cleanseTag(transformedDecideParameters?.audience)}`,
        signal: controller.signal,
        perspective,
        decideParameters: transformedDecideParameters,
        filterResponse: false,
        returnQuery: false,
      })
      .then((response) => {
        const responseStr = JSON.stringify(response.result)
        const hasConditionalContent = responseStr.includes('"conditions"')

        console.warn('[STUDIO-DECIDE] Query response received:', {
          hasConditionalContent,
          decideParameters: transformedDecideParameters,
          resultType: typeof response.result,
          resultSample: `${responseStr.slice(0, 200)}${responseStr.length > 200 ? '...' : ''}`,
        })
        startTransition(() => {
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
  }, [
    client,
    lastLiveEventId,
    params,
    perspective,
    query,
    decideParameters,
    passedDecideParameters,
  ])
  /* eslint-enable max-nested-callbacks */

  return useMemo(() => {
    if (liveDocument && resultSourceMap) {
      // Add diagnostic logging for turboCharge process
      const resultStr = JSON.stringify(result)
      const liveDocStr = JSON.stringify(liveDocument)
      const resultHasConditional = resultStr.includes('"conditions"')
      const liveDocHasConditional = liveDocStr.includes('"conditions"')

      console.warn('[STUDIO-DECIDE] TurboCharge process:', {
        resultHasConditional,
        liveDocHasConditional,
        message: liveDocHasConditional
          ? 'LiveDocument will overwrite resolved conditional content!'
          : 'No conditional content conflict',
      })

      return {
        result: turboChargeResultIfSourceMap(
          liveDocument,
          result,
          perspective,
          resultSourceMap,
          transformedDecideParameters,
        ),
        resultSourceMap,
        syncTags,
      }
    }
    return {result, resultSourceMap, syncTags}
  }, [liveDocument, perspective, result, resultSourceMap, syncTags, transformedDecideParameters])
}

export function turboChargeResultIfSourceMap<T = unknown>(
  liveDocument: Partial<SanityDocument> | null | undefined,
  result: T,
  perspective: ClientPerspective,
  resultSourceMap?: ContentSourceMap,
  decideParameters?: LocalDecideParameters,
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
          // Resolve conditional content in liveDocument before using it
          const resolvedLiveDocument = processDecideFields(
            liveDocument,
            decideParameters,
          ) as Required<Pick<SanityDocument, '_id' | '_type'>>

          console.warn(
            '[STUDIO-DECIDE] TurboCharge: Resolved conditional content in liveDocument',
            {
              originalHasConditional: JSON.stringify(liveDocument).includes('"conditions"'),
              resolvedHasConditional: JSON.stringify(resolvedLiveDocument).includes('"conditions"'),
            },
          )

          return resolvedLiveDocument
        }

        // Resolve conditional content in liveDocument before using it
        const resolvedLiveDocument = processDecideFields(liveDocument, decideParameters)

        console.warn(
          '[STUDIO-DECIDE] TurboCharge: Resolved conditional content in liveDocument (fallback)',
          {
            originalHasConditional: JSON.stringify(liveDocument).includes('"conditions"'),
            resolvedHasConditional: JSON.stringify(resolvedLiveDocument).includes('"conditions"'),
          },
        )

        return {
          ...(resolvedLiveDocument as Partial<SanityDocument>),
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
