import {type SanityClient} from '@sanity/client'
import {type ImageUrlBuilder, type SanityImageSource} from '@sanity/image-url'
import {type ImageSchemaType} from '@sanity/types'
import {memo, useMemo} from 'react'
import {useDevicePixelRatio} from 'use-device-pixel-ratio'

import {useTranslation} from '../../../../i18n'
import {type UploaderResolver} from '../../../studio/uploads/types'
import {ImagePreview} from './ImagePreview'
import {type BaseImageInputValue, type FileInfo} from './types'
import {useImageUrl} from './useImageUrl'

export const ImageInputPreview = memo(function ImageInputPreviewComponent(props: {
  client: SanityClient
  directUploads: boolean | undefined
  handleOpenDialog: () => void
  hoveringFiles: FileInfo[]
  imageUrlBuilder: ImageUrlBuilder
  readOnly: boolean | undefined
  resolveUploader: UploaderResolver
  schemaType: ImageSchemaType
  value: BaseImageInputValue
}) {
  const {
    client,
    directUploads,
    handleOpenDialog,
    hoveringFiles,
    imageUrlBuilder,
    readOnly,
    resolveUploader,
    schemaType,
    value,
  } = props

  return (
    <RenderImageInputPreview
      client={client}
      directUploads={directUploads}
      handleOpenDialog={handleOpenDialog}
      hoveringFiles={hoveringFiles}
      imageUrlBuilder={imageUrlBuilder}
      readOnly={readOnly}
      resolveUploader={resolveUploader}
      schemaType={schemaType}
      value={value}
    />
  )
})

function RenderImageInputPreview(props: {
  client: SanityClient
  directUploads: boolean | undefined
  handleOpenDialog: () => void
  hoveringFiles: FileInfo[]
  imageUrlBuilder: ImageUrlBuilder
  readOnly: boolean | undefined
  resolveUploader: UploaderResolver
  schemaType: ImageSchemaType
  value: BaseImageInputValue
}) {
  const {
    client,
    directUploads,
    handleOpenDialog,
    hoveringFiles,
    imageUrlBuilder,
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
      drag={!value?._upload && hoveringFiles.length > 0}
      isRejected={rejectedFilesCount > 0 || directUploads === false}
      onDoubleClick={handleOpenDialog}
      readOnly={readOnly}
      src={url}
    />
  )
}
