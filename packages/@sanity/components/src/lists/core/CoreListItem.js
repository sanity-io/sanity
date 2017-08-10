// @flow
import React from 'react'
import styles from './styles/CoreListItem.css'
import cx from 'classnames'

export default function CoreListItem(props : any) {
  const {className, ...rest} = props
  return (
    <li {...rest} className={cx(styles.root, className)} />
  )
}
