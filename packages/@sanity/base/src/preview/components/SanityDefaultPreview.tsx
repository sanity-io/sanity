import React, {useEffect} from 'react'
import imageUrlBuilder from '@sanity/image-url'
import {
  Image,
  ImageUrlFitMode,
  isImage,
  isReference,
  Reference,
  SanityDocument,
} from '@sanity/types'
import {DocumentIcon} from '@sanity/icons'
import {assetUrlBuilder, AssetURLBuilderOptions} from '../../assets'
import {
  DefaultPreview,
  BlockImagePreview,
  BlockPreview,
  DetailPreview,
  InlinePreview,
  MediaPreview,
} from '../../components/previews'
import {
  PreviewComponent as PreviewComponentType,
  PreviewLayoutKey,
  PreviewProps,
} from '../../components/previews/types'
import {useSource} from '../../studio'

interface UploadState {
  progress: number
  initiated: string
  updated: string
  file: {name: string; type: string}
  previewImage?: string
}

const previewComponentMap: {[key: string]: PreviewComponentType} = {
  default: DefaultPreview,
  card: DefaultPreview,
  media: MediaPreview,
  detail: DetailPreview,
  inline: InlinePreview,
  block: BlockPreview,
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && !Array.isArray(value) && typeof value === 'object'
}

function extractUploadState(value: PreviewValue | Partial<SanityDocument>): {
  _upload: UploadState | null
  value: PreviewValue | Partial<SanityDocument> | null
} {
  if (!value || typeof value !== 'object') {
    return {_upload: null, value: null}
  }
  const {_upload, ...rest} = value
  return {_upload: _upload as UploadState, value: rest}
}

export interface PreviewValue {
  id?: string
  description?: React.ReactNode
  subtitle?: React.ReactNode
  title?: React.ReactNode
  media?: React.ReactNode | React.ComponentType | Reference | Image
  icon?: boolean
  type?: string
  displayOptions?: {showIcon?: boolean}
  schemaType?: {name?: string}
  _upload?: unknown
  imageUrl?: unknown
  extendedPreview?: unknown
}

interface SanityDefaultPreviewProps extends PreviewProps {
  _renderAsBlockImage?: boolean
  icon?: React.ComponentType | false
  layout?: PreviewLayoutKey
  value: PreviewValue | Partial<SanityDocument> //Partial<SanityDocument> | PreviewValue
}

export function SanityDefaultPreview(props: SanityDefaultPreviewProps) {
  const {
    icon, // omit
    layout,
    _renderAsBlockImage,
    value: valueProp,
    ...rest
  } = props

  let PreviewComponent =
    layout && previewComponentMap.hasOwnProperty(layout)
      ? previewComponentMap[layout]
      : previewComponentMap.default

  if (_renderAsBlockImage) {
    PreviewComponent = BlockImagePreview
  }

  const {_upload, value: uploadValue} = extractUploadState(valueProp)

  const item = _upload
    ? {
        ...uploadValue,
        imageUrl: _upload.previewImage,
        title: uploadValue?.title || (_upload.file && _upload.file.name) || 'Uploading…',
      }
    : uploadValue

  const {client} = useSource()

  const renderMedia = (options: {
    dimensions: {width?: number; height?: number; fit: ImageUrlFitMode; dpr?: number}
  }) => {
    const imageBuilder = imageUrlBuilder(client)

    // This functions exists because the previews provides options
    // for the rendering of the media (dimensions)
    const {dimensions} = options

    const media = valueProp.media as Image

    // Handle sanity image
    return (
      <img
        alt={isString(valueProp.title) ? valueProp.title : undefined}
        referrerPolicy="strict-origin-when-cross-origin"
        src={
          imageBuilder
            .image(media)
            .width(dimensions.width || 100)
            .height(dimensions.height || 100)
            .fit(dimensions.fit)
            .dpr(dimensions.dpr || 1)
            .url() || ''
        }
      />
    )
  }

  const renderImageUrl = (options: {dimensions: AssetURLBuilderOptions}) => {
    // Legacy support for imageUrl
    const {dimensions} = options
    // const {value} = props
    const imageUrl = valueProp.imageUrl
    if (isString(imageUrl)) {
      const assetUrl = assetUrlBuilder(imageUrl.split('?')[0], dimensions)
      return <img src={assetUrl} alt={isString(valueProp.title) ? valueProp.title : undefined} />
    }
    return undefined
  }

  const renderIcon = () => {
    // const {icon} = props
    const Icon = icon || DocumentIcon
    return Icon && <Icon className="sanity-studio__preview-fallback-icon" />
  }

  const resolveMedia = () => {
    const {media} = valueProp
    // const {value, icon} = props
    // const {media} = value

    if (icon === false) {
      // Explicitly disabled
      return false
    }

    if (typeof media === 'function' || (isRecord(media) && React.isValidElement(media))) {
      return media
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

    // Legacy support for imageUrl
    if (valueProp.imageUrl) {
      return renderImageUrl
    }

    // Handle sanity image
    if (isImage(media)) {
      return renderMedia
    }

    // Render fallback icon
    return renderIcon
  }

  useEffect(() => {
    if (layout === 'card') {
      console.warn(
        'The `card` layout option in previews is deprecated. Please use `default` instead.'
      )
    }
  }, [layout])

  if (!item) {
    return <PreviewComponent {...rest} progress={(_upload && _upload.progress) || undefined} />
  }

  const media = resolveMedia()

  return (
    <PreviewComponent
      {...rest}
      title={item.title as any}
      subtitle={item.subtitle as any}
      description={item.description as any}
      extendedPreview={item.extendedPreview as any}
      media={media}
      progress={(_upload && _upload.progress) || undefined}
    />
  )
}
