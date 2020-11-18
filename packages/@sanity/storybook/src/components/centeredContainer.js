import classNames from 'classnames'
import React from 'react'

import styles from './centeredContainer.css'

export function CenteredContainer({children, className: classNameProp, ...restProps}) {
  const className = classNames(styles.root, classNameProp)

  return (
    <div {...restProps} className={className}>
      {children}
    </div>
  )
}
