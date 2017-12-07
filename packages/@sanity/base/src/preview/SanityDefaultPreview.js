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

  renderMedia = options => {

    const {dimensions} = options
    const {value} = this.props

    // check if there is a media function in schema
    if (typeof value.media === 'function') {
      return value.media(options)
    }

    if (typeof value.media === 'string') {
      return value.media
    }

    const imageUrl = this.props.value.imageUrl
    const image = this.props.value.image

    if (image) {
      return (
        <img
          src={
            imageBuilder.image(image)
              .width(dimensions.width || 100)
              .height(dimensions.height || 100)
              .url()
          }
        />
      )
    }

    if (imageUrl) {
      const assetUrl = assetUrlBuilder(imageUrl, {dimensions})
      return <img src={assetUrl} alt="" />
    }

    return false
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


    return (
      <PreviewComponent
        {...rest}
        title={item.title}
        subtitle={item.subtitle}
        description={item.description}
        media={this.renderMedia}
        progress={_upload && _upload.progress}
      />
    )
  }
}
