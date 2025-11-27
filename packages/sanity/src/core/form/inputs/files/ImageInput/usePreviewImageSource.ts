import {getImageDimensions, isImageSource, type SanityImageDimensions} from '@sanity/asset-utils'
import {type SanityClient} from '@sanity/client'
import {type ImageUrlBuilder, type SanityImageSource} from '@sanity/image-url'
import {type CSSProperties, useCallback, useMemo} from 'react'
import {useDevicePixelRatio} from 'use-device-pixel-ratio'

import {type BaseImageInputValue} from './types'
import {useImageUrl} from './useImageUrl'

export function usePreviewImageSource({
  client,
  imageUrlBuilder,
  value,
}: {
  client?: SanityClient
  imageUrlBuilder: ImageUrlBuilder
  value?: BaseImageInputValue
}): {
  url: string | undefined
  dimensions: SanityImageDimensions
  customProperties: CSSProperties
} {
  const dpr = useDevicePixelRatio()

  const transform = useCallback(
    (builder: ImageUrlBuilder, val: SanityImageSource) =>
      isImageSource(val)
        ? builder.width(2000).fit('max').image(val).dpr(dpr).auto('format').url()
        : undefined,
    [dpr],
  )

  const {url} = useImageUrl({
    client,
    imageSource: value,
    imageUrlBuilder,
    transform,
  })

  const dimensions = useMemo<SanityImageDimensions>(
    () =>
      value?.asset
        ? getImageDimensions(value.asset)
        : {
            width: 0,
            height: 0,
            aspectRatio: 0,
          },
    [value],
  )

  const customProperties = useMemo(
    () =>
      ({
        '--image-width': dimensions.width,
        '--image-height': dimensions.height,
      }) as CSSProperties,
    [dimensions.width, dimensions.height],
  )

  return {
    url,
    dimensions,
    customProperties,
  }
}
