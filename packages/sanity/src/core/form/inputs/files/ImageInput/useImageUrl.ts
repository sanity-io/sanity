import {type SanityClient} from '@sanity/client'
import {type ImageUrlBuilder, type SanityImageSource} from '@sanity/image-url'

import {useImageObjectUrl} from './useImageObjectUrl'
import {useMediaLibraryAsset} from './useMediaLibraryAsset'
import {resolveMediaLibraryClient} from './utils/mediaLibrary'

export interface UseImageUrlParameters<T extends SanityImageSource | undefined> {
  client: SanityClient
  imageSource: T
  imageUrlBuilder: ImageUrlBuilder
  transform?: (builder: ImageUrlBuilder, value: SanityImageSource) => string | undefined
}

export interface UseImageUrlResult {
  url: string | undefined
  isLoading: boolean
}

/**
 * Hook for resolving image URLs with Private asset support.
 *
 * Handles access policy checks, applying URL transformations, and object URL
 * generation when needed.
 *
 * @internal
 */
export function useImageUrl<T extends SanityImageSource = SanityImageSource>(
  params: UseImageUrlParameters<T>,
): UseImageUrlResult {
  const {client, imageSource, imageUrlBuilder, transform} = params

  const {
    isChecking: isCheckingForPrivateAsset,
    isPrivate,
    ref,
  } = useMediaLibraryAsset({
    client,
    imageSource,
  })

  // The `http:` or `https:` URL. While a Private asset check is in progress,
  // this stays undefined as it may change after the check completes.
  const networkUrl = (() => {
    if (isCheckingForPrivateAsset) return undefined

    // Use the Media Library specific URL builder when the asset is Private.
    let builder = imageUrlBuilder
    if (isPrivate && client && ref) {
      const mediaLibraryClient = resolveMediaLibraryClient({client, ref})
      if (mediaLibraryClient) {
        builder = imageUrlBuilder.withClient(mediaLibraryClient)
      }
    }

    // Apply the transformations if provided.
    if (transform) return transform(builder, imageSource)
    return builder.image(imageSource).url()
  })()

  // If the asset is Private, we fetch the image using the network URL and convert
  // the response into a `blob:` URL so it can be used as an `<img src>`.
  const {objectUrl, isLoading: objectUrlIsLoading} = useImageObjectUrl(
    isPrivate ? networkUrl : undefined,
  )

  const isLoading = isCheckingForPrivateAsset || objectUrlIsLoading

  const url = isLoading ? undefined : (objectUrl ?? networkUrl)

  return {
    isLoading,
    url,
  }
}
