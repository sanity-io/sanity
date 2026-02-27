import {type ImageUrlBuilder, type SanityImageSource} from '@sanity/image-url'
import {memo} from 'react'
import {useDevicePixelRatio} from 'use-device-pixel-ratio'

import {useTranslation} from '../../../../i18n'
import {type AssetAccessPolicy} from '../types'
import {ImagePreview} from './ImagePreview'
import {type BaseImageInputValue} from './types'
import {useImageUrl} from './useImageUrl'

export const ImageInputPreview = memo(function ImageInputPreviewComponent(props: {
  accessPolicy: AssetAccessPolicy
  handleOpenDialog: () => void
  imageUrlBuilder: ImageUrlBuilder
  readOnly: boolean | undefined
  value: BaseImageInputValue
}) {
  const {accessPolicy, handleOpenDialog, imageUrlBuilder, readOnly, value} = props

  return (
    <RenderImageInputPreview
      accessPolicy={accessPolicy}
      handleOpenDialog={handleOpenDialog}
      imageUrlBuilder={imageUrlBuilder}
      readOnly={readOnly}
      value={value}
    />
  )
})

function RenderImageInputPreview(props: {
  accessPolicy: AssetAccessPolicy
  handleOpenDialog: () => void
  imageUrlBuilder: ImageUrlBuilder
  readOnly: boolean | undefined
  value: BaseImageInputValue
}) {
  const {accessPolicy, handleOpenDialog, imageUrlBuilder, readOnly, value} = props

  const {t} = useTranslation()

  const dpr = useDevicePixelRatio()

  const transform = (builder: ImageUrlBuilder, val: SanityImageSource) =>
    builder.width(2000).fit('max').image(val).dpr(dpr).auto('format').url()

  const {url} = useImageUrl({
    accessPolicy,
    imageSource: value,
    imageUrlBuilder,
    transform,
  })

  return (
    <ImagePreview
      alt={t('inputs.image.preview-uploaded-image')}
      accessPolicy={accessPolicy}
      onDoubleClick={handleOpenDialog}
      readOnly={readOnly}
      src={url}
    />
  )
}
