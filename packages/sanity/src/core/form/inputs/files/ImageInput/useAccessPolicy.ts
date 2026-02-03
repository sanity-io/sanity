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

  // Non-Media Library assets are always 'public'
  if (!ref) return 'public'
  // If we can't check for an access policy (no token)
  if (!canCheck) return 'unknown'
  // If we can check AND a check is in progress
  if (isLoading) return 'checking'
  // The actual fetched policy, default to 'unknown' if undefined
  return cdnAccessPolicy ?? 'unknown'
}
