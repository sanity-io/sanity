import {isImageSource} from '@sanity/asset-utils'
import {type CSSProperties, useMemo} from 'react'
import {useDevicePixelRatio} from 'use-device-pixel-ratio'

import {type ImageUrlBuilder} from '../types'
import {type BaseImageInputValue} from './types'

type Dimensions = [width: number, height: number]

/*
  Used for setting the initial image height - specifically for images
  that are small and so can take less space in the document
*/
const getImageSize = (src: string): Dimensions => {
  const imageUrlParams = new URLSearchParams(src.split('?')[1])
  const rect = imageUrlParams.get('rect')

  if (rect) {
    return [rect.split(',')[2], rect.split(',')[3]].map(Number) as Dimensions
  }

  return src.split('-')[1].split('.')[0].split('x').map(Number) as Dimensions
}

export function usePreviewImageSource<Value extends BaseImageInputValue | undefined>({
  value,
  imageUrlBuilder,
}: {
  value: Value
  imageUrlBuilder: ImageUrlBuilder
}): {
  url: Value extends undefined ? undefined : string
  dimensions: Dimensions
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

  const dimensions = useMemo<Dimensions>(() => (url ? getImageSize(url) : [0, 0]), [url])

  const customProperties = useMemo(
    () =>
      ({
        '--image-width': dimensions[0],
        '--image-height': dimensions[1],
      }) as CSSProperties,
    [dimensions],
  )

  return {
    url,
    dimensions,
    customProperties,
  }
}
