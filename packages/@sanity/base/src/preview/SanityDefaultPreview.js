import PropTypes from 'prop-types'
import React from 'react'
import UploadProgressBar from './UploadProgressBar'
import assetUrlBuilder from 'part:@sanity/base/asset-url-builder'
import imageUrlBuilder from '@sanity/image-url'
import PreviewComponentCard from 'part:@sanity/components/previews/card'
import PreviewComponentDefault from 'part:@sanity/components/previews/default'
import PreviewComponentDetail from 'part:@sanity/components/previews/detail'
import PreviewComponentInline from 'part:@sanity/components/previews/inline'
import PreviewComponentMedia from 'part:@sanity/components/previews/media'
import PreviewComponentBlock from 'part:@sanity/components/previews/block'

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
    layout: PropTypes.oneOf(Object.keys(previewComponentMap)),
    value: PropTypes.object,
    type: PropTypes.shape({
      title: PropTypes.string
    }).isRequired
  }

  legacyCheck = () => {

  }

  renderMedia = options => {
    // This functions exists because the previews provides options
    // for the rendering of the media (dimensions)
    const {dimensions} = options
    const {value} = this.props

    if (!value) {
      return false
    }
    const {media} = value

    // Legacy support for imageUrl
    const imageUrl = value.imageUrl
    if (imageUrl) {
      const assetUrl = assetUrlBuilder(imageUrl, {dimensions})
      return <img src={assetUrl} alt={value.title} />
    }

    if (!media) {
      return value._type
    }

    // Handle sanity image
    if (media._type === 'image') {
      return (
        <img
          src={
            imageBuilder.image(media)
              .width(dimensions.width || 100)
              .height(dimensions.height || 100)
              .fit(dimensions.fit)
              .url()
          }
        />
      )
    }
  }

  resolveMedia = () => {
    const {value} = this.props
    const {media} = value

    // Legacy support for imageUrl
    if (value.imageUrl) {
      return this.renderMedia
    }

    // Handle sanity image
    if (media && media._type === 'image') {
      return this.renderMedia
    }

    return media

  }

  render() {
    const {layout, ...rest} = this.props

    const PreviewComponent = previewComponentMap.hasOwnProperty(layout)
      ? previewComponentMap[layout]
      : previewComponentMap.default

    const {_upload, value} = extractUploadState(this.props.value)

    const item = _upload ? {
      ...value,
      imageUrl: _upload.previewImage,
      title: value.title || (_upload.file && _upload.file.name) || 'Uploading…'
    } : value

    if (!item) {
      return (
        <PreviewComponent
          {...rest}
          progress={_upload && _upload.progress}
        />
      )
    }
    const {type} = this.props
    const media = this.resolveMedia() || type.title || type.name

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
