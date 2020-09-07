import classNames from 'classnames'
import React from 'react'

import styles from './GridList.css'

function GridList(props: React.HTMLProps<HTMLUListElement>) {
  const {children, className, ...restProps} = props

  return (
    <ul {...restProps} className={classNames(styles.root, className)}>
      {children}
    </ul>
  )
}

export default GridList
