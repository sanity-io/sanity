// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import classNames from 'classnames'
import styles from 'part:@sanity/components/buttons/button-grid-style'
import React, {FunctionComponent} from 'react'
import {childrenToElementArray} from '../helpers'

interface ButtonGridProps extends React.HTMLProps<HTMLDivElement> {
  secondary?: React.ReactNode
  align?: 'start' | 'end'
}

const ButtonGrid: FunctionComponent<ButtonGridProps> = (props) => {
  const {
    align = 'start',
    children: childrenProp,
    className: classNameProp,
    secondary,
    ...restProps
  } = props
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
export default ButtonGrid
