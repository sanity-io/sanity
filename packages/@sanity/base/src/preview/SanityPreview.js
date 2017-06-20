import PropTypes from 'prop-types'
import React from 'react'
import PreviewSubscriber from './PreviewSubscriber'
import RenderPreviewSnapshot from './RenderPreviewSnapshot'

export default class SanityPreview extends React.PureComponent {

  static propTypes = {
    layout: PropTypes.string,
    value: PropTypes.any,
    type: PropTypes.object.isRequired
  }


  render() {
    const {type, value, layout} = this.props
    return (
      <PreviewSubscriber type={type} value={value} layout={layout}>
        {RenderPreviewSnapshot}
      </PreviewSubscriber>
    )
  }
}
