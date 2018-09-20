import React from 'react'
import PropTypes from 'prop-types'
import {SanityDefaultPreview} from 'part:@sanity/base/preview'

export default class SimplePaneItemPreview extends React.Component {
  render() {
    const {icon, layout, value} = this.props
    return <SanityDefaultPreview value={value} icon={icon} layout={layout} />
  }
}
SimplePaneItemPreview.propTypes = {
  layout: PropTypes.string,
  icon: PropTypes.func,
  value: PropTypes.object
}
