import React, {PropTypes} from 'react'

import PreviewComponentCard from 'part:@sanity/components/previews/card'
import PreviewComponentDefault from 'part:@sanity/components/previews/default'
import PreviewComponentDetail from 'part:@sanity/components/previews/detail'
import PreviewComponentInline from 'part:@sanity/components/previews/inline'
import PreviewComponentMedia from 'part:@sanity/components/previews/media'
import {canonicalizePreviewConfig, prepareValue} from './utils'

const previewComponentMap = {
  default: PreviewComponentDefault,
  card: PreviewComponentCard,
  media: PreviewComponentMedia,
  detail: PreviewComponentDetail,
  inline: PreviewComponentInline
}

export default class DefaultPreview extends React.Component {

  static propTypes = {
    style: PropTypes.oneOf(Object.keys(previewComponentMap)),
    value: PropTypes.object,
    field: PropTypes.object.isRequired
  };

  render() {
    const {style, value, field} = this.props

    const PreviewComponent = previewComponentMap.hasOwnProperty(style)
      ? previewComponentMap[style]
      : previewComponentMap.default

    // todo: do this at schema parse time instead
    const previewConfig = canonicalizePreviewConfig(field)

    return <PreviewComponent item={prepareValue(value, previewConfig)} />
  }
}
