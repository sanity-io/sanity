import {type SanityClient} from '@sanity/client'
import {type SanityImageSource} from '@sanity/image-url'
import {type AssetSource} from '@sanity/types'
import useSWR from 'swr'

import {enqueueAssetAccessPolicyFetch} from '../../../../store/accessPolicy/fetch'
import {getMediaLibraryRef, type MediaLibraryRef} from '../../../../store/accessPolicy/refs'
import {useProjectDatasets} from '../../../../store/project/useProjectDatasets'
import {type AssetAccessPolicy} from '../types'

/**
 * Resolve the effective access policy for a given image source, including
 * Media Library specific checks when possible, and dataset-level visibility
 * for plain image assets.
 *
 * @internal
 */
export function useAccessPolicy(params: {
  client: SanityClient
  source?: AssetSource | SanityImageSource
}): AssetAccessPolicy {
  const {client, source} = params

  const ref = getMediaLibraryRef(source)

  // If the client doesn't have a token (i.e. cookie auth), set the requestKey
  // to null to bypass the cdnAccessPolicy check as it will always fail.
  const canCheck = Boolean(ref && client.config().token)
  const requestKey = canCheck ? ref : null

  // useSWR gives us synchronous access to the cached policy values so the UI
  // can render without a flash of loading state while
  // enqueueAssetAccessPolicyFetch (which always returns a promise) settles.
  const fetcher = async (key: MediaLibraryRef) => enqueueAssetAccessPolicyFetch(key, client)
  const options = {
    dedupingInterval: 0,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    shouldRetryOnError: false,
  }
  const {data: cdnAccessPolicy, isLoading} = useSWR(requestKey, fetcher, options)

  const {value: datasets} = useProjectDatasets()

  // Media Library asset: defer to the per-asset cdnAccessPolicy lookup
  if (ref) {
    if (!canCheck) return 'unknown'
    if (isLoading) return 'checking'
    return cdnAccessPolicy ?? 'unknown'
  }

  // Plain asset: derive policy from the workspace dataset's aclMode so private
  // datasets route through the authed blob-fetch path in `useImageUrl`.
  const datasetName = client.config().dataset
  if (!datasetName) return 'public'
  if (datasets === null) return 'checking'
  const datasetEntry = datasets.find((entry) => entry.name === datasetName)
  if (!datasetEntry) return 'public'
  return datasetEntry.aclMode
}
