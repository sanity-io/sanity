/* eslint-disable complexity */
import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/buttons/button-collection-style'

export default class ButtonCollection extends React.PureComponent {
  static propTypes = {
    children: PropTypes.node.isRequired,
    secondary: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf([PropTypes.node])]),
    align: PropTypes.oneOf(['start', 'end']),
    className: PropTypes.string
  }

  static defaultProps = {
    align: 'start',
    secondary: null,
    className: ''
  }

  render() {
    const {align, children, secondary, className} = this.props
    return (
      <div className={`${align === 'start' ? styles.alignStart : styles.alignEnd} ${className}`}>
        <div className={styles.primary}>{children}</div>
        {secondary && <div className={styles.secondary}>{secondary}</div>}
      </div>
    )
  }
}
