import PropTypes from 'prop-types'
import React from 'react'
import UploadProgressBar from './UploadProgressBar'
import assetUrlBuilder from 'part:@sanity/base/asset-url-builder'
import PreviewComponentCard from 'part:@sanity/components/previews/card'
import PreviewComponentDefault from 'part:@sanity/components/previews/default'
import PreviewComponentDetail from 'part:@sanity/components/previews/detail'
import PreviewComponentInline from 'part:@sanity/components/previews/inline'
import PreviewComponentMedia from 'part:@sanity/components/previews/media'
import PreviewComponentBlock from 'part:@sanity/components/previews/block'

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
    value: PropTypes.object
  }

  renderMedia = settings => {
    if (this.props.value.imageUrl) {
      const assetUrl = assetUrlBuilder({...this.props.assetSize, url: imageUrl})
      return <img src={this.item.imageUrl} alt="" />
    }
    return undefined
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

    return (
      <div>
        <PreviewComponent
          title={item.title}
          subtitle={item.subtitle}
          description={item.description}
          renderMedia={this.renderMedia}
          {...rest}
          progress={_upload && _upload.progress}
        />
      </div>
    )
  }
}
