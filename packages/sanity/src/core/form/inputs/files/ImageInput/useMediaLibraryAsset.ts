import {type SanityClient} from '@sanity/client'
import {type SanityImageSource} from '@sanity/image-url'
import useSWR from 'swr'

import {enqueueAssetAccessPolicyFetch} from '../../../../store/accessPolicy/fetch'
import {getMediaLibraryRef, type MediaLibraryRef} from '../../../../store/accessPolicy/refs'
import {resolveMediaLibraryClient} from './utils/mediaLibrary'

export function useMediaLibraryAsset(params: {
  client: SanityClient
  imageSource: SanityImageSource
}): {
  isChecking: boolean
  isPrivate: boolean
  ref: MediaLibraryRef | undefined
} {
  const {client, imageSource} = params

  const ref = getMediaLibraryRef(imageSource)
  const mediaLibraryClient = ref ? resolveMediaLibraryClient({client, ref}) : undefined

  // useSWR gives us synchronous access to the cached policy values so the UI
  // can render without a flash of loading state while
  // enqueueAssetAccessPolicyFetch (which always returns a promise) settles.
  const requestKey = client && ref ? ref : null
  const fetcher = async (key: MediaLibraryRef) =>
    enqueueAssetAccessPolicyFetch(key, mediaLibraryClient)
  const options = {
    dedupingInterval: 0,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    shouldRetryOnError: false,
  }
  const {data: cdnAccessPolicy, isLoading: isChecking} = useSWR(requestKey, fetcher, options)

  const isPrivate = !!mediaLibraryClient && cdnAccessPolicy === 'private'

  return {
    ref,
    isChecking,
    isPrivate,
  }
}
