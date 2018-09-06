import PropTypes from 'prop-types'
import React from 'react'
import {PreviewAny} from './utils/fallback-preview/PreviewAny'

export default class Preview extends React.PureComponent {
  static propTypes = {
    layout: PropTypes.string,
    value: PropTypes.any,
    type: PropTypes.object.isRequired
  }

  static contextTypes = {
    formBuilder: PropTypes.object
  }

  render() {
    const {type, value} = this.props

    const PreviewComponent = this.context.formBuilder.resolvePreviewComponent(type)

    if (PreviewComponent) {
      return <PreviewComponent {...this.props} />
    }
    return (
      <div title="Unable to resolve preview component. Using fallback.">
        <PreviewAny value={value} maxDepth={2} />
      </div>
    )
  }
}
