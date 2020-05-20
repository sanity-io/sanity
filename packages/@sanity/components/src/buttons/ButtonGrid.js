/* eslint-disable complexity */

import classNames from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/buttons/button-grid-style'

function toChildrenArray(val) {
  return (Array.isArray(val) ? val : [val]).filter(node => node !== null && node !== undefined)
}

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
    const {align, children: childrenProp, className, secondary} = this.props
    const children = toChildrenArray(childrenProp)
    const secondaryChildren = toChildrenArray(secondary)
    const len = children.length + secondaryChildren.length

    if (len === 0) return null

    return (
      <div
        className={classNames(className, align === 'start' ? styles.alignStart : styles.alignEnd)}
        data-buttons={len}
      >
        {children}
        {secondaryChildren.map((child, childIndex) => (
          <div className={styles.secondary} key={String(childIndex)}>
            {child}
          </div>
        ))}
      </div>
    )
  }
}
