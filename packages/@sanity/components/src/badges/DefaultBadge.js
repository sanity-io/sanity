import PropTypes from 'prop-types'
import React from 'react'

import styles from './styles/DefaultBadge.modules.css'

export default class DefaultBadge extends React.PureComponent {
  static propTypes = {
    color: PropTypes.oneOf([undefined, 'success', 'warning', 'danger', 'info', 'neutral']),
    inverted: PropTypes.bool,
    faded: PropTypes.bool,
    children: PropTypes.node,
    title: PropTypes.string
  }

  static defaultProps = {
    color: undefined,
    inverted: false
  }

  render() {
    const {color, inverted, children, title, faded} = this.props
    return (
      <span
        className={inverted ? styles.inverted : styles.default}
        data-color={color}
        data-faded={faded}
        title={title}
      >
        {children}
      </span>
    )
  }
}
