import classNames from 'classnames'
import styles from 'part:@sanity/components/buttons/button-grid-style'
import React from 'react'
import {childrenToElementArray} from '../helpers'

interface ButtonGridProps {
  secondary?: React.ReactNode
  align?: 'start' | 'end'
}

// @todo: refactor to functional component
export default class ButtonGrid extends React.PureComponent<
  ButtonGridProps & React.HTMLProps<HTMLDivElement>
> {
  render() {
    const {
      align = 'start',
      children: childrenProp,
      className: classNameProp,
      secondary,
      ...restProps
    } = this.props
    const children = childrenToElementArray(childrenProp)
    const secondaryChildren = childrenToElementArray(secondary)
    const len = children.length + secondaryChildren.length

    if (len === 0) return null

    const className = classNames(
      classNameProp,
      align === 'start' ? styles.alignStart : styles.alignEnd
    )

    return (
      <div {...restProps} className={className} data-buttons={len}>
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
