import React from 'react'
import cx from 'classnames'
import styles from './styles/GridItem.css'

export default function GridItem(props) {
  // eslint-disable-next-line react/prop-types
  const {className, ...rest} = props
  return <li {...rest} className={cx(styles.root, className)} />
}
