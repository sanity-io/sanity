import createImageUrlBuilder from '@sanity/image-url'
import {type ImageUrlFitMode} from '@sanity/types'
import {type ForwardedRef, forwardRef, type HTMLAttributes, useMemo} from 'react'

import {useClient} from '../../hooks'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'

export interface ImageCrop {
  _type: 'sanity.imageCrop'
  top: number
  bottom: number
  left: number
  right: number
}

export interface ImageHotspot {
  _type: 'sanity.imageHotspot'
  x: number
  y: number
  height: number
  width: number
}

export interface ImageSource {
  _type: 'image'
  asset: {
    _type: 'reference'
    _ref: string
  }
  crop?: ImageCrop
  hotspot?: ImageHotspot
}

export interface ImageProps {
  dpr?: number
  fit?: ImageUrlFitMode
  source: ImageSource
  height?: number
  width?: number
}

export const Image = forwardRef(function Image(
  props: ImageProps & Omit<HTMLAttributes<HTMLImageElement>, 'height' | 'src' | 'width'>,
  ref: ForwardedRef<HTMLImageElement>,
) {
  const {dpr, fit, height, source, width, ...restProps} = props
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const imageUrlBuilder = useMemo(() => createImageUrlBuilder(client), [client])
  const image = useMemo(() => imageUrlBuilder.image(source), [imageUrlBuilder, source])

  const url = useMemo(() => {
    let b = image

    if (dpr) b = b.dpr(dpr)
    if (fit) b = b.fit(fit)
    if (width) b = b.width(width)
    if (height) b = b.height(height)

    return b.url()
  }, [dpr, fit, height, image, width])

  return <img {...restProps} ref={ref} src={url} />
})
