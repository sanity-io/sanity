import {isImageSource} from '@sanity/asset-utils'
import {type ImageSchemaType} from '@sanity/types'
import {memo, useMemo} from 'react'
import {useDevicePixelRatio} from 'use-device-pixel-ratio'

import {useTranslation} from '../../../../i18n'
import {type UploaderResolver} from '../../../studio/uploads/types'
import {type ImageUrlBuilder} from '../types'
import {ImagePreview} from './ImagePreview'
import {type BaseImageInputValue, type FileInfo} from './types'

export const ImageInputPreview = memo(function ImageInputPreviewComponent(props: {
  directUploads: boolean | undefined
  handleOpenDialog: () => void
  hoveringFiles: FileInfo[]
  imageUrlBuilder: ImageUrlBuilder
  initialHeight: number | undefined
  readOnly: boolean | undefined
  resolveUploader: UploaderResolver
  schemaType: ImageSchemaType
  value: BaseImageInputValue | undefined
}) {
  const {
    directUploads,
    handleOpenDialog,
    hoveringFiles,
    imageUrlBuilder,
    initialHeight,
    readOnly,
    resolveUploader,
    schemaType,
    value,
  } = props

  const isValueImageSource = useMemo(() => isImageSource(value), [value])
  if (!value || !isValueImageSource) {
    return null
  }

  return (
    <RenderImageInputPreview
      directUploads={directUploads}
      handleOpenDialog={handleOpenDialog}
      hoveringFiles={hoveringFiles}
      imageUrlBuilder={imageUrlBuilder}
      initialHeight={initialHeight}
      readOnly={readOnly}
      resolveUploader={resolveUploader}
      schemaType={schemaType}
      value={value}
    />
  )
})

function RenderImageInputPreview(props: {
  directUploads: boolean | undefined
  handleOpenDialog: () => void
  hoveringFiles: FileInfo[]
  imageUrlBuilder: ImageUrlBuilder
  initialHeight: number | undefined
  readOnly: boolean | undefined
  resolveUploader: UploaderResolver
  schemaType: ImageSchemaType
  value: BaseImageInputValue
}) {
  const {
    directUploads,
    handleOpenDialog,
    hoveringFiles,
    imageUrlBuilder,
    initialHeight,
    readOnly,
    resolveUploader,
    schemaType,
    value,
  } = props

  const {t} = useTranslation()
  const acceptedFiles = useMemo(
    () => hoveringFiles.filter((file) => resolveUploader(schemaType, file)),
    [hoveringFiles, resolveUploader, schemaType],
  )
  const rejectedFilesCount = useMemo(
    () => hoveringFiles.length - acceptedFiles.length,
    [acceptedFiles, hoveringFiles],
  )
  const dpr = useDevicePixelRatio()
  const imageUrl = useMemo(
    () => imageUrlBuilder.width(2000).fit('max').image(value).dpr(dpr).auto('format').url(),
    [dpr, imageUrlBuilder, value],
  )
  return (
    <ImagePreview
      alt={t('inputs.image.preview-uploaded-image')}
      drag={!value?._upload && hoveringFiles.length > 0}
      initialHeight={initialHeight}
      isRejected={rejectedFilesCount > 0 || !directUploads}
      onDoubleClick={handleOpenDialog}
      readOnly={readOnly}
      src={imageUrl}
    />
  )
}
