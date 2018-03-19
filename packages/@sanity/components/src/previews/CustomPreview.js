import PropTypes from 'prop-types'
import React from 'react'

export default class CustomPreview extends React.PureComponent {
  static propTypes = {
    children: PropTypes.node
  }

  render() {
    const {children} = this.props
    return <div>{children}</div>
  }
}
