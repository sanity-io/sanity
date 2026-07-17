import {type SanityDocument} from '@sanity/types'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {useClient} from 'sanity'

import {DEMO_API_VERSION, VARIANT_QUERY_PARAM} from './constants'

/** A query result document. Perspectives normalize `_id` and carry the real id in `_originalId`. */
export type ResolvedDocument = SanityDocument & {_originalId?: string}

interface QueryResponseBody {
  result?: ResolvedDocument | null
  error?: {description?: string}
  message?: string
}

interface ContentLakeDocumentState {
  document: ResolvedDocument | null | undefined
  loading: boolean
  error: string | undefined
  /** The full request URL, shown in the tool's request inspector. */
  requestUrl: string
  refetch: () => void
}

/**
 * Fetches a document exactly the way a frontend would: a hand-rolled `fetch` against the query
 * API with every query-string parameter built here — `query`, `$`-prefixed params, `perspective`
 * and (crucially) the `variant`.
 *
 * Deliberately NOT `client.fetch`/`client.request`: `@sanity/client` does not support passing a
 * variant with queries yet, and the studio-configured client injects its own perspective — which
 * would fight the perspective/variant combination this tool demonstrates. The client is only used
 * to read connection config (project id, dataset, api host, token).
 */
export function useContentLakeDocument(options: {
  query: string
  params?: Record<string, unknown>
  /** Comma-joined perspective stack, e.g. `published`, `drafts` or `rXYZ,rABC,drafts`. */
  perspective: string
  /** The short variant name (no `_.variants.` prefix). Omitted → base content. */
  variantName?: string
  /** When false the hook stays idle (no document id entered yet). */
  enabled: boolean
}): ContentLakeDocumentState {
  const {query, params, perspective, variantName, enabled} = options
  const client = useClient({apiVersion: DEMO_API_VERSION})
  const {projectId, dataset, apiHost = 'https://api.sanity.io', token} = client.config()

  // The latest settled response, keyed by the url it was fetched for. `loading` is derived by
  // comparing it against the current url (no synchronous setState in the effect).
  const [settled, setSettled] = useState<{
    url: string
    document?: ResolvedDocument | null
    error?: string
  } | null>(null)
  const [refreshCount, setRefreshCount] = useState(0)

  const paramsKey = JSON.stringify(params ?? {})

  const requestUrl = useMemo(() => {
    const parsedParams: Record<string, unknown> = JSON.parse(paramsKey)
    const searchParams = new URLSearchParams()
    searchParams.set('query', query)
    for (const [key, value] of Object.entries(parsedParams)) {
      searchParams.set(`$${key}`, JSON.stringify(value))
    }
    searchParams.set('perspective', perspective)
    if (variantName) {
      searchParams.set(VARIANT_QUERY_PARAM, variantName)
    }
    // `https://<projectId>.<api host>/v<version>/data/query/<dataset>?...`
    const host = apiHost.replace(/^https?:\/\//, '')
    return `https://${projectId}.${host}/v${DEMO_API_VERSION}/data/query/${dataset}?${searchParams}`
  }, [apiHost, dataset, paramsKey, perspective, projectId, query, variantName])

  useEffect(() => {
    if (!enabled) {
      return undefined
    }

    const controller = new AbortController()

    async function run() {
      try {
        const response = await fetch(requestUrl, {
          signal: controller.signal,
          // Cookie-based auth, like the studio itself uses in the browser. The token fallback
          // covers workspaces configured with token auth.
          credentials: 'include',
          headers: token ? {Authorization: `Bearer ${token}`} : undefined,
        })
        const body: QueryResponseBody = await response.json()
        if (controller.signal.aborted) return

        if (!response.ok) {
          const description = body?.error?.description || body?.message || `HTTP ${response.status}`
          setSettled({url: requestUrl, error: description})
          return
        }

        setSettled({url: requestUrl, document: body.result ?? null})
      } catch (err) {
        if (controller.signal.aborted) return
        setSettled({url: requestUrl, error: err instanceof Error ? err.message : String(err)})
      }
    }

    void run()

    return () => {
      controller.abort()
    }
  }, [enabled, requestUrl, token, refreshCount])

  const refetch = useCallback(() => setRefreshCount((count) => count + 1), [])

  const isCurrent = enabled && settled?.url === requestUrl

  return {
    document: isCurrent ? settled?.document : undefined,
    loading: enabled && !isCurrent,
    error: isCurrent ? settled?.error : undefined,
    requestUrl,
    refetch,
  }
}
