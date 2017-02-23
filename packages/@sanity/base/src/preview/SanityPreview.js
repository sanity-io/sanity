import React, {PropTypes} from 'react'

import PreviewComponentCard from 'part:@sanity/components/previews/card'
import PreviewComponentDefault from 'part:@sanity/components/previews/default'
import PreviewComponentDetail from 'part:@sanity/components/previews/detail'
import PreviewComponentInline from 'part:@sanity/components/previews/inline'
import PreviewComponentMedia from 'part:@sanity/components/previews/media'
import PreviewComponentBlock from 'part:@sanity/components/previews/block'

import PreviewSubscriber from './PreviewSubscriber'
import prepareForPreview from './prepareForPreview'

const previewComponentMap = {
  default: PreviewComponentDefault,
  card: PreviewComponentCard,
  media: PreviewComponentMedia,
  detail: PreviewComponentDetail,
  inline: PreviewComponentInline,
  block: PreviewComponentBlock
}

// Set this to true for debugging preview subscriptions
const DEBUG = false
export default class SanityPreview extends React.PureComponent {

  static propTypes = {
    layout: PropTypes.oneOf(Object.keys(previewComponentMap)),
    value: PropTypes.object,
    type: PropTypes.object.isRequired
  }

  render() {
    const {layout, value, type} = this.props

    const PreviewComponent = previewComponentMap.hasOwnProperty(layout)
      ? previewComponentMap[layout]
      : previewComponentMap.default

    return (
      <PreviewSubscriber type={type} value={value}>
        {
          ({snapshot, isLive}) => {
            const preview = (
              <PreviewComponent item={prepareForPreview(snapshot, type)} isPlaceholder={!snapshot && !isLive} />
            )
            return DEBUG ? (
              <div>
                <span style={{position: 'absolute', right: 24, top: 2}}>{isLive ? '⚡️' : '💤'}</span>
                {preview}
              </div>
            ) : preview
          }
        }
      </PreviewSubscriber>
    )
  }
}
