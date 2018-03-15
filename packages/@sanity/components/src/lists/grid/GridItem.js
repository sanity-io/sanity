import React from 'react'
import cx from 'classnames'
import styles from './styles/GridItem.css'

export default function GridItem(props: {className: string}) {
  const {className, ...rest} = props
  return <li {...rest} className={cx(styles.root, className)} />
}
