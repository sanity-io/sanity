import React, {PropTypes} from 'react'

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

export default class SanityDefaultPreview extends React.PureComponent {

  static propTypes = {
    layout: PropTypes.oneOf(Object.keys(previewComponentMap)),
    value: PropTypes.object,
    type: PropTypes.object.isRequired
  }

  render() {
    const {layout, value, ...rest} = this.props

    const PreviewComponent = previewComponentMap.hasOwnProperty(layout)
      ? previewComponentMap[layout]
      : previewComponentMap.default

    return <PreviewComponent item={value} {...rest} />
  }
}
