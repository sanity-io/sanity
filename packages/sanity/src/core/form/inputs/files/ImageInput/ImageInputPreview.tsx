import {memo} from 'react'

import {useTranslation} from '../../../../i18n'
import {type ImageUrlBuilder} from '../types'
import {ImagePreview} from './ImagePreview'
import {type BaseImageInputValue} from './types'
import {usePreviewImageSource} from './usePreviewImageSource'

export const ImageInputPreview = memo(function ImageInputPreviewComponent(props: {
  handleOpenDialog: () => void
  imageUrlBuilder: ImageUrlBuilder
  readOnly: boolean | undefined
  value: BaseImageInputValue
}) {
  const {handleOpenDialog, imageUrlBuilder, readOnly, value} = props

  return (
    <RenderImageInputPreview
      handleOpenDialog={handleOpenDialog}
      imageUrlBuilder={imageUrlBuilder}
      readOnly={readOnly}
      value={value}
    />
  )
})

function RenderImageInputPreview(props: {
  handleOpenDialog: () => void
  imageUrlBuilder: ImageUrlBuilder
  readOnly: boolean | undefined
  value: BaseImageInputValue
}) {
  const {handleOpenDialog, imageUrlBuilder, readOnly, value} = props

  const {t} = useTranslation()

  const {url} = usePreviewImageSource({value, imageUrlBuilder})

  return (
    <ImagePreview
      alt={t('inputs.image.preview-uploaded-image')}
      onDoubleClick={handleOpenDialog}
      readOnly={readOnly}
      src={url}
    />
  )
}
