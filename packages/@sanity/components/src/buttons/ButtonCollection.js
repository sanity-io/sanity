/* eslint-disable complexity */
import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/buttons/button-collection-style'

export default class ButtonCollection extends React.PureComponent {
  static propTypes = {
    children: PropTypes.node.isRequired,
    secondary: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf([PropTypes.node])]),
    align: PropTypes.oneOf(['start', 'end'])
  }

  static defaultProps = {
    align: 'start',
    secondary: null
  }

  render() {
    const {align, children, secondary} = this.props

    if (secondary && (secondary.length > 0 || typeof secondary !== 'object')) {
      return (
        <div className={align === 'start' ? styles.alignStart : styles.alignEnd} data-buttons={children.length + secondary.length}>
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
      <div className={align === 'start' ? styles.alignStart : styles.alignEnd}>
        {children || secondary}
      </div>
    )
  }
}
