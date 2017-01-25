import React, {PropTypes} from 'react'

import PreviewComponentCard from 'part:@sanity/components/previews/card'
import PreviewComponentDefault from 'part:@sanity/components/previews/default'
import PreviewComponentDetail from 'part:@sanity/components/previews/detail'
import PreviewComponentInline from 'part:@sanity/components/previews/inline'
import PreviewComponentMedia from 'part:@sanity/components/previews/media'

import PreviewMaterializer from './PreviewMaterializer'

const previewComponentMap = {
  default: PreviewComponentDefault,
  card: PreviewComponentCard,
  media: PreviewComponentMedia,
  detail: PreviewComponentDetail,
  inline: PreviewComponentInline
}

export default class SanityPreviewComponent extends React.Component {

  static propTypes = {
    style: PropTypes.oneOf(Object.keys(previewComponentMap)),
    value: PropTypes.object,
    type: PropTypes.object.isRequired
  };

  render() {
    const {style, value, type} = this.props

    const PreviewComponent = previewComponentMap.hasOwnProperty(style)
      ? previewComponentMap[style]
      : previewComponentMap.default

    const previewConfig = type.options.preview
    return (
      <PreviewMaterializer value={value} config={previewConfig}>
        {v => <PreviewComponent item={v} />}
      </PreviewMaterializer>
    )
  }
}
