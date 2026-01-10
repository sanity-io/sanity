import {type SanityClient} from '@sanity/client'
import {type SanityImageSource} from '@sanity/image-url'
import useSWR from 'swr'

import {enqueueAssetAccessPolicyFetch} from '../../../../store/accessPolicy/fetch'
import {getMediaLibraryRef, type MediaLibraryRef} from '../../../../store/accessPolicy/refs'
import {resolveMediaLibraryClient} from './utils/mediaLibrary'

type MediaLibraryAssetAccessPolicy = 'public' | 'private' | 'unknown'

export function useMediaLibraryAsset(params: {
  client: SanityClient
  imageSource: SanityImageSource
}): {
  accessPolicy: MediaLibraryAssetAccessPolicy
  isChecking: boolean
  ref: MediaLibraryRef | undefined
} {
  const {client, imageSource} = params

  const ref = getMediaLibraryRef(imageSource)
  const mediaLibraryClient = ref ? resolveMediaLibraryClient({client, ref}) : undefined

  // If the client doesn't have a token (i.e. cookie auth), set the requestKey
  // to null to bypass the cdnAccessPolicy check as it will always fail.
  const canCheck = Boolean(mediaLibraryClient && mediaLibraryClient.config().token)
  const requestKey = canCheck ? ref : null

  // useSWR gives us synchronous access to the cached policy values so the UI
  // can render without a flash of loading state while
  // enqueueAssetAccessPolicyFetch (which always returns a promise) settles.
  const fetcher = async (key: MediaLibraryRef) =>
    enqueueAssetAccessPolicyFetch(key, mediaLibraryClient)
  const options = {
    dedupingInterval: 0,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    shouldRetryOnError: false,
  }
  const {data: cdnAccessPolicy, isLoading: isChecking} = useSWR(requestKey, fetcher, options)

  // Compute the effective access policy:
  // - Non-Media Library assets are always 'public'
  // - Explicitly return 'unknown' if we can't check or a check is in progress
  // - Otherwise return the resolved policy. Default to 'public' if undefined
  const accessPolicy = (() => {
    if (!ref) return 'public'
    if (!canCheck || isChecking) return 'unknown'
    return cdnAccessPolicy ?? 'public'
  })()

  return {
    accessPolicy,
    isChecking,
    ref,
  }
}
