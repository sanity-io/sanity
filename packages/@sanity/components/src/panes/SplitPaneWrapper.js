import PropTypes from 'prop-types'
import React from 'react'

export default class SplitPaneWrapper extends React.Component {
  static propTypes = {
    minWidth: PropTypes.number,
    maxWidth: PropTypes.number,
    defaultWidth: PropTypes.number,
    children: PropTypes.node
  }

  static defaultProps = {
    minWidth: 0,
    maxWidth: 0,
    defaultWidth: 0
  }

  render() {
    return this.props.children || <div />
  }
}
