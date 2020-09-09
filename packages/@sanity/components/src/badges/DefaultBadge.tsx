import PropTypes from 'prop-types'
import React from 'react'

import styles from './DefaultBadge.css'

export default class DefaultBadge extends React.PureComponent {
  static propTypes = {
    color: PropTypes.oneOf([undefined, 'success', 'warning', 'danger', 'info']),
    children: PropTypes.node.isRequired,
    title: PropTypes.string
  }

  static defaultProps = {
    color: undefined,
    title: undefined
  }

  render() {
    const {color, children, title} = this.props

    return (
      <span className={styles.root} data-color={color} title={title}>
        {children}
      </span>
    )
  }
}
