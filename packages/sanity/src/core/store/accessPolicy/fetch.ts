import {type SanityClient} from '@sanity/client'
import DataLoader from 'dataloader'
import QuickLRU from 'quick-lru'

import {makeMediaLibraryRef, type MediaLibraryRef} from './refs'

type AccessPolicyResult = 'public' | 'private' | undefined

const POLICY_CACHE_MAX_SIZE = 2000
const POLICY_CACHE_MAX_AGE = 1000 * 60 * 5 // 5 minutes

const loaders = new Map<string, DataLoader<string, AccessPolicyResult>>()
const policyCache = new QuickLRU<string, AccessPolicyResult>({
  maxAge: POLICY_CACHE_MAX_AGE,
  maxSize: POLICY_CACHE_MAX_SIZE,
})

/**
 * Batch fetch asset access policies from the Media Library API and populate the
 * cache.
 */
async function fetchAccessPoliciesBatch(params: {
  assetIds: readonly string[]
  client: SanityClient
  libraryId: string
}): Promise<AccessPolicyResult[]> {
  const {assetIds, client, libraryId} = params

  if (assetIds.length === 0) {
    return []
  }

  try {
    const results = await client.fetch<{_id: string; cdnAccessPolicy?: AccessPolicyResult}[]>(
      `*[_id in $ids]{_id, cdnAccessPolicy}`,
      {ids: assetIds},
    )

    const policyById = Object.fromEntries(results.map((doc) => [doc._id, doc.cdnAccessPolicy]))

    return assetIds.map((assetId) => {
      const policy = policyById[assetId]
      const assetRef = makeMediaLibraryRef(libraryId, assetId)
      policyCache.set(assetRef, policy)
      return policy
    })
  } catch (error) {
    console.error('Error fetching cdnAccessPolicy batch', {
      libraryId,
      assetIds,
      error,
    })

    assetIds.forEach((assetId) => {
      const assetRef = makeMediaLibraryRef(libraryId, assetId)
      policyCache.set(assetRef, undefined)
    })

    return assetIds.map(() => undefined)
  }
}

/**
 * Creates a Media Library-specific client with an explicitly configured API
 * host that includes the project ID in the subdomain. This is to satisfy CORS
 * requirements when performing CDN access policy checks, as browser requests
 * will fail against the global host because it does not include CORS headers.
 */
function createMediaLibraryClient(client: SanityClient, libraryId: string): SanityClient {
  const {apiHost: base, projectId: subdomain} = client.config()

  if (!subdomain) {
    throw new Error('Cannot create Media Library client: missing projectId in client config')
  }

  const baseUrl = new URL(base)
  baseUrl.hostname = `${subdomain}.${baseUrl.hostname}`
  const apiHost = baseUrl.toString()

  return client.withConfig({
    apiHost,
    resource: {
      id: libraryId,
      type: 'media-library',
    },
  })
}

/**
 * Resolve (or create) the DataLoader responsible for fetching asset access
 * policies from a given Media Library.
 *
 * NOTE: The first client passed for a given library ID will be used to create the
 * DataLoader instance, subsequent clients for the same library ID will be ignored.
 */
function resolveAssetPolicyLoader(
  client: SanityClient,
  libraryId: string,
): DataLoader<string, AccessPolicyResult> {
  const existingLoader = loaders.get(libraryId)

  if (existingLoader) {
    return existingLoader
  }

  const mediaLibraryClient = createMediaLibraryClient(client, libraryId)

  const loader = new DataLoader<string, AccessPolicyResult>(
    (assetIds) =>
      fetchAccessPoliciesBatch({
        assetIds,
        client: mediaLibraryClient,
        libraryId,
      }),
    {cache: false}, // only batch per tick, rely on QuickLRU for caching
  )

  loaders.set(libraryId, loader)
  return loader
}

/**
 * Schedule an asset access policy fetch using the library-specific DataLoader.
 * Returns the cached policy value if it's already been resolved.
 *
 * @internal
 */
export function enqueueAssetAccessPolicyFetch(
  assetRef: MediaLibraryRef,
  client?: SanityClient,
): Promise<AccessPolicyResult> {
  const [, libraryId, assetId] = assetRef.split(':', 3)

  if (!libraryId || !assetId || !client) {
    return Promise.resolve(undefined)
  }

  if (policyCache.has(assetRef)) {
    const policy = policyCache.get(assetRef) ?? undefined
    return Promise.resolve(policy)
  }

  const loader = resolveAssetPolicyLoader(client, libraryId)
  return loader.load(assetId)
}
