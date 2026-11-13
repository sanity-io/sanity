import {type SanityClient} from '@sanity/client'
import {type SanityImageSource} from '@sanity/image-url'
import {type AssetSource} from '@sanity/types'
import useSWR from 'swr'

import {enqueueAssetAccessPolicyFetch} from '../../../../store/accessPolicy/fetch'
import {getMediaLibraryRef, type MediaLibraryRef} from '../../../../store/accessPolicy/refs'
import {type AssetAccessPolicy} from '../types'

/**
 * Resolve the effective access policy for a given image source, including
 * Media Library specific checks when possible.
 *
 * @internal
 */
export function useAccessPolicy(params: {
  client: SanityClient
  source?: AssetSource | SanityImageSource
}): AssetAccessPolicy {
  const {client, source} = params

  const ref = getMediaLibraryRef(source)
  const requestKey = ref ?? null

  // useSWR gives us synchronous access to the cached policy values so the UI
  // can render without a flash of loading state while
  // enqueueAssetAccessPolicyFetch (which always returns a promise) settles.
  const fetcher = async (key: MediaLibraryRef): Promise<AssetAccessPolicy | undefined> => {
    // Without a bearer token (cookie auth) the cdnAccessPolicy check always fails, so it is
    // skipped. The credential is read through `getAuth()`: under a reactive `auth` it is
    // settled asynchronously and `config().token` may be unset or stale.
    const {token} = await client.getAuth()
    if (!token) return 'unknown'
    return enqueueAssetAccessPolicyFetch(key, client)
  }
  const options = {
    dedupingInterval: 0,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    shouldRetryOnError: false,
  }
  const {data: cdnAccessPolicy, isLoading} = useSWR(requestKey, fetcher, options)

  // Non-Media Library assets are always 'public'
  if (!ref) return 'public'
  // A check is in progress
  if (isLoading) return 'checking'
  // The actual fetched policy, default to 'unknown' if undefined
  return cdnAccessPolicy ?? 'unknown'
}
