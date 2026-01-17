import {type SanityClient} from '@sanity/client'
import {type ImageUrlBuilder, type SanityImageSource} from '@sanity/image-url'

import {getMediaLibraryRef} from '../../../../store/accessPolicy/refs'
import {type AssetAccessPolicy} from './types'
import {useImageObjectUrl} from './useImageObjectUrl'
import {resolveMediaLibraryClient} from './utils/mediaLibrary'

interface UseImageUrlParameters<T extends SanityImageSource | undefined> {
  accessPolicy?: AssetAccessPolicy
  client: SanityClient
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
  const {accessPolicy = 'public', client, imageSource, imageUrlBuilder, transform} = params

  const ref = getMediaLibraryRef(imageSource)
  const isPolicyCheckInProgress = accessPolicy === 'checking'
  const isPrivate = accessPolicy === 'private'

  // The `http:` or `https:` URL. While an access policy check is in progress,
  // this stays undefined as it may change after the check completes.
  const networkUrl = (() => {
    if (!imageSource || isPolicyCheckInProgress) return undefined

    // Use the Media Library specific URL builder when the asset is Private.
    let builder = imageUrlBuilder
    if (isPrivate && ref) {
      const mediaLibraryClient = resolveMediaLibraryClient({client, ref})
      if (mediaLibraryClient) {
        builder = imageUrlBuilder.withClient(mediaLibraryClient)
      }
    }

    // Apply the transformations if provided.
    if (transform) return transform(builder, imageSource)
    return builder.image(imageSource).url()
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
