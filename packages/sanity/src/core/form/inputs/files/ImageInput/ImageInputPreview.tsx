import {type SanityClient} from '@sanity/client'
import {type ImageUrlBuilder, type SanityImageSource} from '@sanity/image-url'
import {memo} from 'react'
import {useDevicePixelRatio} from 'use-device-pixel-ratio'

import {useTranslation} from '../../../../i18n'
import {ImagePreview} from './ImagePreview'
import {type BaseImageInputValue} from './types'
import {useImageUrl} from './useImageUrl'

export const ImageInputPreview = memo(function ImageInputPreviewComponent(props: {
  client: SanityClient
  handleOpenDialog: () => void
  imageUrlBuilder: ImageUrlBuilder
  readOnly: boolean | undefined
  value: BaseImageInputValue
}) {
  const {client, handleOpenDialog, imageUrlBuilder, readOnly, value} = props

  return (
    <RenderImageInputPreview
      client={client}
      handleOpenDialog={handleOpenDialog}
      imageUrlBuilder={imageUrlBuilder}
      readOnly={readOnly}
      value={value}
    />
  )
})

function RenderImageInputPreview(props: {
  client: SanityClient
  handleOpenDialog: () => void
  imageUrlBuilder: ImageUrlBuilder
  readOnly: boolean | undefined
  value: BaseImageInputValue
}) {
  const {client, handleOpenDialog, imageUrlBuilder, readOnly, value} = props

  const {t} = useTranslation()

  const dpr = useDevicePixelRatio()

  const transform = (builder: ImageUrlBuilder, val: SanityImageSource) =>
    builder.width(2000).fit('max').image(val).dpr(dpr).auto('format').url()

  const {url} = useImageUrl({
    client,
    imageSource: value,
    imageUrlBuilder,
    transform,
  })

  return (
    <ImagePreview
      alt={t('inputs.image.preview-uploaded-image')}
      onDoubleClick={handleOpenDialog}
      readOnly={readOnly}
      src={url}
    />
  )
}
