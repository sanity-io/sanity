import {useCallback, useEffect, useMemo, useState} from 'react'
import {useClient} from 'sanity'

import {
  DEMO_API_VERSION,
  getVariantConditionEntries,
  VARIANT_CONDITION_QUERY_PARAM,
  VARIANT_QUERY_PARAM,
  type VariantQueryMode,
} from './constants'

interface CoffeeQueryState<T> {
  data: T | undefined
  loading: boolean
  error: string | undefined
  /** The full request URL, shown in the demo's request inspector. */
  requestUrl: string
  refetch: () => void
}

export interface CoffeeQueryOptions {
  query: string
  params?: Record<string, unknown>
  /** How the page targets variant content. */
  queryMode: VariantQueryMode
  /** Variant id mode — sticky param from the studio navbar. */
  variantName?: string
  /** Conditions mode — repeated `variantCondition=key:value` params. */
  variantConditions?: Record<string, string>
  /** The query perspective (follows the studio's pinned perspective; `published` by default). */
  perspective?: string
}

/**
 * Fetches published content exactly the way a frontend would: a hand-rolled `fetch` against the
 * query API, with every query-string parameter built here.
 *
 * Deliberately NOT `client.fetch`/`client.request`: `@sanity/client` does not support passing a
 * variant with queries yet, and the studio-configured client injects its own perspective — which
 * would fight the `perspective=published` + variant combination this demo is about. The client
 * is only used to read connection config (project id, dataset, api host, token).
 */
export function useCoffeeQuery<T>(options: CoffeeQueryOptions): CoffeeQueryState<T> {
  const {
    query,
    params,
    queryMode,
    variantName,
    variantConditions,
    perspective = 'published',
  } = options
  const client = useClient({apiVersion: DEMO_API_VERSION})
  const {projectId, dataset, apiHost = 'https://api.sanity.io', token} = client.config()

  const [settled, setSettled] = useState<{url: string; data?: T; error?: string} | null>(null)
  const [refreshCount, setRefreshCount] = useState(0)

  const paramsKey = JSON.stringify(params ?? {})
  const conditionsKey = JSON.stringify(variantConditions ?? {})

  const requestUrl = useMemo(() => {
    const parsedParams: Record<string, unknown> = JSON.parse(paramsKey)
    const searchParams = new URLSearchParams()
    searchParams.set('query', query)
    for (const [key, value] of Object.entries(parsedParams)) {
      searchParams.set(`$${key}`, JSON.stringify(value))
    }
    searchParams.set('perspective', perspective)

    if (queryMode === 'variant-id' && variantName) {
      searchParams.set(VARIANT_QUERY_PARAM, variantName)
    }

    if (queryMode === 'variant-conditions') {
      for (const {param} of getVariantConditionEntries(JSON.parse(conditionsKey))) {
        searchParams.append(VARIANT_CONDITION_QUERY_PARAM, param)
      }
    }

    const host = apiHost.replace(/^https?:\/\//, '')
    return `https://${projectId}.${host}/v${DEMO_API_VERSION}/data/query/${dataset}?${searchParams}`
  }, [
    apiHost,
    conditionsKey,
    dataset,
    paramsKey,
    perspective,
    projectId,
    query,
    queryMode,
    variantName,
  ])

  useEffect(() => {
    const controller = new AbortController()

    async function run() {
      try {
        const response = await fetch(requestUrl, {
          signal: controller.signal,
          credentials: 'include',
          headers: token ? {Authorization: `Bearer ${token}`} : undefined,
        })
        const body = await response.json()
        if (controller.signal.aborted) return

        if (!response.ok) {
          const description = body?.error?.description || body?.message || `HTTP ${response.status}`
          setSettled({url: requestUrl, error: description})
          return
        }

        setSettled({url: requestUrl, data: body.result as T})
      } catch (err) {
        if (controller.signal.aborted) return
        setSettled({url: requestUrl, error: err instanceof Error ? err.message : String(err)})
      }
    }

    void run()

    return () => {
      controller.abort()
    }
  }, [requestUrl, token, refreshCount])

  const refetch = useCallback(() => setRefreshCount((count) => count + 1), [])

  const isCurrent = settled?.url === requestUrl

  return {
    data: isCurrent ? settled?.data : undefined,
    loading: !isCurrent,
    error: isCurrent ? settled?.error : undefined,
    requestUrl,
    refetch,
  }
}
