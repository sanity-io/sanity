import {getImageDimensions, isImageSource, type SanityImageDimensions} from '@sanity/asset-utils'
import {type CSSProperties, useMemo} from 'react'
import {useDevicePixelRatio} from 'use-device-pixel-ratio'

import {type ImageUrlBuilder} from '../types'
import {type BaseImageInputValue} from './types'

export function usePreviewImageSource<Value extends BaseImageInputValue | undefined>({
  value,
  imageUrlBuilder,
}: {
  value: Value
  imageUrlBuilder: ImageUrlBuilder
}): {
  url: Value extends undefined ? undefined : string
  dimensions: SanityImageDimensions
  customProperties: CSSProperties
} {
  const dpr = useDevicePixelRatio()

  const url = useMemo(
    () =>
      value && isImageSource(value)
        ? imageUrlBuilder.width(2000).fit('max').image(value).dpr(dpr).auto('format').url()
        : undefined,
    [dpr, imageUrlBuilder, value],
  ) as Value extends undefined ? undefined : string

  const dimensions = useMemo<SanityImageDimensions>(
    () =>
      url
        ? getImageDimensions(url)
        : {
            width: 0,
            height: 0,
            aspectRatio: 0,
          },
    [url],
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
