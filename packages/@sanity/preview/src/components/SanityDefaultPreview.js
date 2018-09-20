import PropTypes from 'prop-types'
import React from 'react'
import assetUrlBuilder from 'part:@sanity/base/asset-url-builder'
import imageUrlBuilder from '@sanity/image-url'
import PreviewComponentCard from 'part:@sanity/components/previews/card'
import PreviewComponentDefault from 'part:@sanity/components/previews/default'
import PreviewComponentDetail from 'part:@sanity/components/previews/detail'
import PreviewComponentInline from 'part:@sanity/components/previews/inline'
import PreviewComponentMedia from 'part:@sanity/components/previews/media'
import PreviewComponentBlock from 'part:@sanity/components/previews/block'
import PreviewComponentBlockImage from 'part:@sanity/components/previews/block-image'
import sanityClient from 'part:@sanity/base/client'

const imageBuilder = imageUrlBuilder(sanityClient)

const previewComponentMap = {
  default: PreviewComponentDefault,
  card: PreviewComponentCard,
  media: PreviewComponentMedia,
  detail: PreviewComponentDetail,
  inline: PreviewComponentInline,
  block: PreviewComponentBlock
}

function extractUploadState(value) {
  if (!value || typeof value !== 'object') {
    return {_upload: null, value}
  }
  const {_upload, ...rest} = value
  return {_upload, value: rest}
}

export default class SanityDefaultPreview extends React.PureComponent {
  static propTypes = {
    _renderAsBlockImage: PropTypes.bool,
    layout: PropTypes.oneOf(Object.keys(previewComponentMap)),
    value: PropTypes.object,
    icon: PropTypes.func
  }

  renderMedia = options => {
    // This functions exists because the previews provides options
    // for the rendering of the media (dimensions)
    const {dimensions} = options
    const {value} = this.props
    const {media} = value

    // Handle sanity image
    return (
      <img
        alt={value.title}
        src={imageBuilder
          .image(media)
          .width(dimensions.width || 100)
          .height(dimensions.height || 100)
          .fit(dimensions.fit)
          .url()}
      />
    )
  }

  renderImageUrl = options => {
    // Legacy support for imageUrl
    const {dimensions} = options
    const {value} = this.props
    const imageUrl = value.imageUrl
    if (imageUrl) {
      const assetUrl = assetUrlBuilder(imageUrl.split('?')[0], dimensions)
      return <img src={assetUrl} alt={value.title} />
    }
    return undefined
  }

  renderIcon = options => {
    const {icon} = this.props
    const Icon = icon
    return Icon && <Icon className="sanity-studio__preview-fallback-icon" />
  }

  resolveMedia = () => {
    const {value} = this.props
    const {media} = value

    if (typeof media === 'function' || React.isValidElement(media)) {
      return media
    }

    // Legacy support for imageUrl
    if (value.imageUrl) {
      return this.renderImageUrl
    }

    // Handle sanity image
    if (media && media.asset) {
      return this.renderMedia
    }

    // Render fallback icon
    return this.renderIcon
  }

  render() {
    const {layout, _renderAsBlockImage, ...rest} = this.props

    let PreviewComponent = previewComponentMap.hasOwnProperty(layout)
      ? previewComponentMap[layout]
      : previewComponentMap.default

    if (_renderAsBlockImage) {
      PreviewComponent = PreviewComponentBlockImage
    }

    const {_upload, value} = extractUploadState(this.props.value)

    const item = _upload
      ? {
          ...value,
          imageUrl: _upload.previewImage,
          title: value.title || (_upload.file && _upload.file.name) || 'Uploading…'
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
        media={media}
        progress={_upload && _upload.progress}
      />
    )
  }
}
