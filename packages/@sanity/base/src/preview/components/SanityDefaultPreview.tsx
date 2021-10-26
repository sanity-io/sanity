import React from 'react'
import imageUrlBuilder from '@sanity/image-url'
import {ImageUrlFitMode, SanityDocument} from '@sanity/types'
import {DocumentIcon} from '@sanity/icons'
import {assetUrlBuilder} from '../../assets'
import {versionedClient} from '../../client/versionedClient'
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
  PreviewProps,
} from '../../components/previews/types'

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

function extractUploadState(
  value: Partial<SanityDocument>
): {_upload: UploadState | null; value: Partial<SanityDocument>} {
  if (!value || typeof value !== 'object') {
    return {_upload: null, value}
  }
  const {_upload, ...rest} = value
  return {_upload: _upload as UploadState, value: rest}
}

interface SanityDefaultPreviewProps extends PreviewProps {
  _renderAsBlockImage?: boolean
  icon?: React.ComponentType<any> | false
  layout?: 'default' | 'card' | 'media' | 'detail' | 'inline' | 'block'
  value: Partial<SanityDocument>
}

export default class SanityDefaultPreview extends React.PureComponent<SanityDefaultPreviewProps> {
  componentDidMount() {
    if (this.props.layout === 'card') {
      console.warn(
        'The `card` layout option in previews is deprecated. Please use `default` instead.'
      )
    }
  }

  renderMedia = (options: {
    dimensions: {width?: number; height?: number; fit: ImageUrlFitMode; dpr?: number}
  }) => {
    const imageBuilder = imageUrlBuilder(versionedClient)

    // This functions exists because the previews provides options
    // for the rendering of the media (dimensions)
    const {dimensions} = options
    const {value} = this.props
    const {media} = value

    // Handle sanity image
    return (
      <img
        alt={isString(value.title) ? value.title : undefined}
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

  renderImageUrl = (options) => {
    // Legacy support for imageUrl
    const {dimensions} = options
    const {value} = this.props
    const imageUrl = value.imageUrl
    if (isString(imageUrl)) {
      const assetUrl = assetUrlBuilder(imageUrl.split('?')[0], dimensions)
      return <img src={assetUrl} alt={isString(value.title) ? value.title : undefined} />
    }
    return undefined
  }

  renderIcon = () => {
    const {icon} = this.props
    const Icon = icon || DocumentIcon
    return Icon && <Icon className="sanity-studio__preview-fallback-icon" />
  }

  resolveMedia = () => {
    const {value, icon} = this.props
    const {media} = value

    if (icon === false) {
      // Explicitly disabled
      return false
    }

    if (typeof media === 'function' || React.isValidElement(media)) {
      return media
    }

    // If the asset is on media
    if (isRecord(value.media) && value.media._type === 'reference' && value.media._ref) {
      return this.renderMedia
    }

    // Legacy support for imageUrl
    if (value.imageUrl) {
      return this.renderImageUrl
    }

    // Handle sanity image
    if (isRecord(media) && media.asset) {
      return this.renderMedia
    }

    // Render fallback icon
    return this.renderIcon
  }

  render() {
    const {
      icon, // omit
      layout,
      _renderAsBlockImage,
      value: valueProp,
      ...rest
    } = this.props

    let PreviewComponent = previewComponentMap.hasOwnProperty(layout)
      ? previewComponentMap[layout]
      : previewComponentMap.default

    if (_renderAsBlockImage) {
      PreviewComponent = BlockImagePreview
    }

    const {_upload, value} = extractUploadState(valueProp)

    const item = _upload
      ? {
          ...value,
          imageUrl: _upload.previewImage,
          title: value.title || (_upload.file && _upload.file.name) || 'Uploading…',
        }
      : value

    if (!item) {
      return <PreviewComponent {...rest} progress={_upload && _upload.progress} />
    }

    const media = this.resolveMedia()

    return (
      <PreviewComponent
        {...rest}
        title={item.title}
        subtitle={item.subtitle}
        description={item.description}
        extendedPreview={item.extendedPreview}
        media={media}
        progress={_upload && _upload.progress}
      />
    )
  }
}
