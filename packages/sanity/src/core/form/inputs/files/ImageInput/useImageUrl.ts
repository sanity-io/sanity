import {type ImageUrlBuilder, type SanityImageSource} from '@sanity/image-url'

import {type AssetAccessPolicy} from '../types'
import {useImageObjectUrl} from './useImageObjectUrl'

interface UseImageUrlParameters<T extends SanityImageSource | undefined> {
  accessPolicy?: AssetAccessPolicy
  imageSource?: T
  imageUrlBuilder: ImageUrlBuilder
  transform?: (builder: ImageUrlBuilder, value: SanityImageSource) => string | undefined
}

interface UseImageUrlResult {
  isLoading: boolean
  url: string | undefined
}

/**
 * Hook for resolving image URLs with Private asset support.
 *
 * Handles applying URL transformations and object URL generation when needed.
 *
 * @internal
 */
export function useImageUrl<T extends SanityImageSource = SanityImageSource>(
  params: UseImageUrlParameters<T>,
): UseImageUrlResult {
  const {accessPolicy = 'public', imageSource, imageUrlBuilder, transform} = params

  const isPolicyCheckInProgress = accessPolicy === 'checking'
  const isPrivate = accessPolicy === 'private'

  // The `http:` or `https:` URL. While an access policy check is in progress,
  // this stays undefined as it may change after the check completes.
  const networkUrl = (() => {
    if (!imageSource || isPolicyCheckInProgress) return undefined
    // Apply the transformations if provided.
    if (transform) return transform(imageUrlBuilder, imageSource)
    return imageUrlBuilder.image(imageSource).url()
  })()

  // If the asset is Private, fetch the image using the network URL and convert
  // the response into a `blob:` URL so it can be used as an `<img src>`.
  const {objectUrl, isLoading: objectUrlIsLoading} = useImageObjectUrl(
    isPrivate ? networkUrl : undefined,
  )

  const isLoading = isPolicyCheckInProgress || objectUrlIsLoading
  const url = isLoading ? undefined : (objectUrl ?? networkUrl)

  return {
    isLoading,
    url,
  }
}
