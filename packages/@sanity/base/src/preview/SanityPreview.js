import React, {PropTypes} from 'react'
import {resolver} from '.'
import PreviewSubscriber from './PreviewSubscriber'
import prepareForPreview from './prepareForPreview'

// Set this to true for debugging preview subscriptions
const DEBUG = false
export default class SanityPreview extends React.PureComponent {

  static propTypes = {
    layout: PropTypes.string,
    value: PropTypes.object,
    type: PropTypes.object.isRequired
  }

  render() {
    const {type, value, layout} = this.props

    const PreviewComponent = resolver(type)

    if (!PreviewComponent) {
      return <div>No preview for {JSON.stringify(value)}</div>
    }

    return (
      <PreviewSubscriber type={type} value={value}>
        {
          ({snapshot, isLive}) => {
            const preview = (
              <PreviewComponent
                value={prepareForPreview(snapshot, type)}
                layout={layout}
                isPlaceholder={!snapshot}
              />
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
