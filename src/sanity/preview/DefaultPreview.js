import React, {PropTypes} from 'react'

import PreviewComponentCard from 'part:@sanity/components/previews/card'
import PreviewComponentDefault from 'part:@sanity/components/previews/default'
import PreviewComponentDetail from 'part:@sanity/components/previews/detail'
import PreviewComponentInline from 'part:@sanity/components/previews/inline'
import PreviewComponentMedia from 'part:@sanity/components/previews/media'

import fallbackPreviewProps from './fallbackPreviewProps'

const previewMapping = {
  default: PreviewComponentDefault,
  card: PreviewComponentCard,
  media: PreviewComponentMedia,
  detail: PreviewComponentDetail,
  inline: PreviewComponentInline
}

function getOrCall(fnOrVal, ...rest) {
  return typeof fnOrVal === 'function' ? fnOrVal(...rest) : fnOrVal
}

export default class DefaultPreview extends React.Component {

  static propTypes = {
    style: PropTypes.oneOf(Object.keys(previewMapping)),
    value: PropTypes.object,
    field: PropTypes.object.isRequired
  };

  render() {
    const {style, value, field} = this.props
    const PreviewComponent = previewMapping.hasOwnProperty(style)
      ? previewMapping[style]
      : previewMapping.default

    const previewProps = (field.options && field.options.preview)
      ? getOrCall(field.options.preview, value)
      : fallbackPreviewProps(value)

    return <PreviewComponent item={previewProps} />
  }
}
