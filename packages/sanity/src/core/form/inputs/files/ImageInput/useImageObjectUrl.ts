import {useEffect, useState} from 'react'

import {useToken} from '../../../studio/assetSourceMediaLibrary/hooks/useToken'

/**
 * @internal
 */
export interface UseImageObjectUrlResult {
  error: Error | null
  isLoading: boolean
  objectUrl: string | undefined
}

interface RequestCacheEntry {
  abortController: AbortController
  blob: Blob | null
  cleanupTimer?: ReturnType<typeof setTimeout>
  error: Error | null
  listeners: Set<() => void>
  objectUrl?: string
  status: 'pending' | 'success' | 'error'
}

// Delay before disposing cache entries to handle React Strict Mode re-mounts
const CACHE_DISPOSE_DELAY = 2000

// Cache shared across all hook instances keyed by `${token}:${url}` to ensure
// unique entries per authenticated request.
const requestCache = new Map<string, RequestCacheEntry>()

const IDLE_RESULT: UseImageObjectUrlResult = {
  error: null,
  isLoading: false,
  objectUrl: undefined,
}

const LOADING_RESULT: UseImageObjectUrlResult = {
  error: null,
  isLoading: true,
  objectUrl: undefined,
}

function createCacheKey(url: string | undefined, token: string | undefined): string | undefined {
  if (!url || !token) return undefined
  return `${token}:${url}`
}

function notifyListeners(entry: RequestCacheEntry): void {
  entry.listeners.forEach((listener) => listener())
}

function deriveResultFromEntry(entry: RequestCacheEntry): UseImageObjectUrlResult {
  switch (entry.status) {
    case 'pending':
      // While loading, preserve any existing objectUrl for smoother transitions
      return entry.objectUrl
        ? {objectUrl: entry.objectUrl, isLoading: true, error: null}
        : LOADING_RESULT
    case 'success':
      return {objectUrl: entry.objectUrl, isLoading: false, error: null}
    case 'error':
      return {objectUrl: undefined, isLoading: false, error: entry.error}
    default:
      return IDLE_RESULT
  }
}

function createFetchCacheEntry(url: string, token: string): RequestCacheEntry {
  const abortController = new AbortController()

  const entry: RequestCacheEntry = {
    abortController,
    blob: null,
    cleanupTimer: undefined,
    error: null,
    listeners: new Set(),
    objectUrl: undefined,
    status: 'pending',
  }

  fetch(url, {
    cache: 'force-cache',
    headers: {Authorization: `Bearer ${token}`},
    signal: abortController.signal,
  })
    .then((res) => res.blob())
    .then((blob) => {
      entry.blob = blob
      entry.error = null
      entry.status = 'success'
      entry.objectUrl = URL.createObjectURL(blob)
      notifyListeners(entry)
    })
    .catch((error) => {
      entry.blob = null
      entry.error = error as Error
      entry.status = 'error'
      notifyListeners(entry)
    })

  return entry
}

/**
 * Fetches an authenticated image (using a token) and returns an object URL for
 * use as an `<img src>`
 *
 * Caches using a url/token pair so multiple components can share a single
 * fetch, and keeps cache entries alive briefly after the last consumer unmounts
 * to avoid duplicate fetches when in strict mode.
 *
 * Automatically revokes object URLs and disposes cache entries when no longer
 * referenced.
 *
 * @internal
 */
export function useImageObjectUrl(url: string | undefined): UseImageObjectUrlResult {
  const token = useToken()
  const cacheKey = createCacheKey(url, token)

  // Initialize state from cache if available to ensure we don't flash a loading
  // state if data is already available.
  const [state, setState] = useState<UseImageObjectUrlResult>(() => {
    if (!cacheKey) return IDLE_RESULT
    const entry = requestCache.get(cacheKey)
    return entry ? deriveResultFromEntry(entry) : LOADING_RESULT
  })

  useEffect(() => {
    // No cacheKey (i.e. no URL or token) means we can't fetch. Reset to idle state,
    // skipping the update if already in an idle state
    if (!cacheKey) {
      setState((prev) => (prev.objectUrl || prev.isLoading || prev.error ? IDLE_RESULT : prev))
      return undefined
    }

    // Get or create cache entry for this URL/token pair
    let entry = requestCache.get(cacheKey)
    if (!entry) {
      // url and token are guaranteed to exist when cacheKey exists
      entry = createFetchCacheEntry(url!, token!)
      requestCache.set(cacheKey, entry)
    }

    // Cancel any pending cleanup from a previous unmount (e.g. Strict Mode)
    if (entry.cleanupTimer) {
      clearTimeout(entry.cleanupTimer)
      entry.cleanupTimer = undefined
    }

    // Subscribe to fetch completion and sync current state
    const updateState = () => setState(deriveResultFromEntry(entry))
    updateState()
    entry.listeners.add(updateState)

    return () => {
      entry.listeners.delete(updateState)

      if (entry.listeners.size === 0) {
        // Delay disposal to allow Strict Mode re-mounts to reuse the entry
        entry.cleanupTimer = setTimeout(() => {
          entry.abortController.abort()
          if (entry.objectUrl) {
            URL.revokeObjectURL(entry.objectUrl)
          }
          requestCache.delete(cacheKey)
        }, CACHE_DISPOSE_DELAY)
      }
    }
  }, [cacheKey, token, url])

  return state
}
