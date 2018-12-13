/* eslint-disable complexity */
import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/buttons/button-grid-style'

export default class ButtonGrid extends React.PureComponent {
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
    const {align, children, secondary} = this.props

    if (!children) {
      return null
    }

    if (secondary && (secondary.length > 0 || typeof secondary !== 'object')) {
      return (
        <div
          className={align === 'start' ? styles.alignStart : styles.alignEnd}
          data-buttons={children.filter(Boolean).length + secondary.filter(Boolean).length}
        >
          {children}
          {secondary.length > 0
            ? secondary.map((child, i) => (
                <div className={styles.secondary} key={i}>
                  {child}
                </div>
              ))
            : secondary}
        </div>
      )
    }

    return (
      <div
        className={align === 'start' ? styles.alignStart : styles.alignEnd}
        data-buttons={children.filter(Boolean).length}
      >
        {children || secondary}
      </div>
    )
  }
}
