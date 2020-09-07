import cx from 'classnames'
import React from 'react'

import styles from './styles/GridItem.css'

export default function GridItem(props: React.HTMLProps<HTMLLIElement>) {
  const {className, ...rest} = props

  return <li {...rest} className={cx(styles.root, className)} />
}
