import {type ContentSourceMap} from '@sanity/client'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {type QueryRequest, type VisionResponseMeta} from '../store/types'
import {useVisionSelector} from '../store/VisionActorContext'

interface OneOffFetch {
  /** The response on screen when the fetch started; a newer one makes the source map stale */
  meta: VisionResponseMeta | undefined
  /** The request URL it was fetched for; another query, params or option makes it stale */
  url: string
  status: 'fetching' | 'done' | 'failed'
  sourceMap?: ContentSourceMap
  error?: string
}

export interface OneOffSourceMap {
  /** The fetched source map, while it still belongs to the shown response and current request */
  sourceMap: ContentSourceMap | undefined
  status: 'idle' | 'fetching' | 'done' | 'failed'
  error: string | undefined
  /** Fetches the current request once more with a content source map */
  fetch: () => void
}

/**
 * The Content Source Map tab's own fetch of the current query with a source map, for a response
 * that came without one. It leaves the query runner alone: the result, the history and the
 * "Include content source map" option stay as they are, and the source map is dropped once the
 * next fetch settles or the request changes.
 */
export function useOneOffSourceMap(
  request: QueryRequest | null,
  meta: VisionResponseMeta | undefined,
): OneOffSourceMap {
  const resultSourceMap = useVisionSelector((snapshot) => snapshot.context.response.resultSourceMap)
  const [oneOff, setOneOff] = useState<OneOffFetch | undefined>(undefined)
  const abortRef = useRef<AbortController | null>(null)
  useEffect(() => () => abortRef.current?.abort(), [])

  const fetch = useCallback(() => {
    if (!request) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const started: OneOffFetch = {meta, url: request.url, status: 'fetching'}
    setOneOff(started)
    request.client
      .fetch(request.query, request.params, {
        filterResponse: false,
        resultSourceMap,
        useCdn: request.useCdn,
        tag: 'vision',
        signal: controller.signal,
      })
      .then(
        (response) => setOneOff({...started, status: 'done', sourceMap: response.resultSourceMap}),
        (error: unknown) => {
          if (controller.signal.aborted) return
          setOneOff({
            ...started,
            status: 'failed',
            error: error instanceof Error ? error.message : String(error),
          })
        },
      )
  }, [meta, request, resultSourceMap])

  const current = oneOff && oneOff.meta === meta && oneOff.url === request?.url ? oneOff : undefined
  return useMemo(
    () => ({
      sourceMap: current?.sourceMap,
      status: current?.status ?? 'idle',
      error: current?.error,
      fetch,
    }),
    [current, fetch],
  )
}
