import {DocumentIcon} from '@sanity/icons'
import imageUrlBuilder from '@sanity/image-url'
import {
  Image,
  ImageUrlFitMode,
  isImage,
  isReference,
  PreviewValue,
  SanityDocumentLike,
  UploadState,
} from '@sanity/types'
import React, {ComponentType, ReactElement, useCallback, useMemo} from 'react'
import {
  BlockImagePreview,
  BlockPreview,
  DefaultPreview,
  DetailPreview,
  InlinePreview,
  MediaPreview,
  PreviewLayoutKey,
  PreviewProps,
} from '../../components/previews'
import {useClient} from '../../hooks'
import {isRecord, isString} from '../../util'

const previewComponentMap: {
  [TLayoutKey in PreviewLayoutKey]: React.ComponentType<PreviewProps<TLayoutKey>>
} = {
  default: DefaultPreview,
  media: MediaPreview,
  detail: DetailPreview,
  inline: InlinePreview,
  block: BlockPreview,
  blockImage: BlockImagePreview,
}

function extractUploadState(value: PreviewValue | SanityDocumentLike | null): {
  _upload: UploadState | null
  value: PreviewValue | SanityDocumentLike | null
} {
  if (!value || typeof value !== 'object') {
    return {_upload: null, value: null}
  }
  const {_upload, ...rest} = value
  return {_upload: _upload as UploadState, value: rest}
}

export interface SanityDefaultPreviewProps extends PreviewProps {
  icon?: React.ComponentType | false
  layout?: PreviewLayoutKey
  value?: PreviewValue | SanityDocumentLike
}

export function SanityDefaultPreview(props: SanityDefaultPreviewProps): ReactElement {
  const {icon, layout, value: valueProp = {}, ...restProps} = props

  const client = useClient()

  const PreviewComponent = (
    layout && previewComponentMap.hasOwnProperty(layout)
      ? previewComponentMap[layout]
      : previewComponentMap.default
  ) as ComponentType<PreviewProps>

  const {_upload, value: uploadValue} = useMemo(() => extractUploadState(valueProp), [valueProp])

  const item: any = useMemo(
    () =>
      _upload
        ? {
            ...uploadValue,
            imageUrl: _upload.previewImage,
            title: uploadValue?.title || (_upload.file && _upload.file.name) || 'Uploading…',
          }
        : uploadValue,
    [_upload, uploadValue]
  )

  const renderMedia = useCallback(
    (options: {
      dimensions: {width?: number; height?: number; fit: ImageUrlFitMode; dpr?: number}
    }) => {
      const imageBuilder = imageUrlBuilder(client)

      // This functions exists because the previews provides options
      // for the rendering of the media (dimensions)
      const {dimensions} = options

      const _media = valueProp.media as Image

      // Handle sanity image
      return (
        <img
          alt={isString(valueProp.title) ? valueProp.title : undefined}
          referrerPolicy="strict-origin-when-cross-origin"
          src={
            imageBuilder
              .image(_media)
              .width(dimensions.width || 100)
              .height(dimensions.height || 100)
              .fit(dimensions.fit)
              .dpr(dimensions.dpr || 1)
              .url() || ''
          }
        />
      )
    },
    [client, valueProp.media, valueProp.title]
  )

  const renderIcon = useCallback(() => {
    const Icon = icon || DocumentIcon
    return Icon && <Icon className="sanity-studio__preview-fallback-icon" />
  }, [icon])

  const media = useMemo(() => {
    if (icon === false) {
      // Explicitly disabled
      return false
    }

    if (
      typeof valueProp.media === 'function' ||
      (isRecord(valueProp.media) && React.isValidElement(valueProp.media))
    ) {
      return valueProp.media
    }

    // If the asset is on media
    if (
      isRecord(valueProp.media) &&
      isReference(valueProp.media) &&
      valueProp.media._type === 'reference' &&
      valueProp.media._ref
    ) {
      return renderMedia
    }

    // Handle sanity image
    if (isImage(valueProp.media)) {
      return renderMedia
    }

    // Render fallback icon
    return renderIcon
  }, [icon, renderIcon, renderMedia, valueProp])

  const progress = (_upload && _upload.progress) || undefined

  if (!item) {
    return <PreviewComponent {...restProps} progress={progress} />
  }

  return (
    <PreviewComponent
      {...restProps}
      title={item.title}
      subtitle={item.subtitle}
      description={item.description}
      media={media}
      progress={progress}
    />
  )
}
