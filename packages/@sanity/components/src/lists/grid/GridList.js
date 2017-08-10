// @flow
import React from 'react'
import CoreList from '../core/CoreList'
import styles from './styles/GridList.css'
import cx from 'classnames'

export default function GridList(props : {className: string}) {
  const {className, ...rest} = props
  return <CoreList {...rest} className={cx(styles.root, className)} />
}
