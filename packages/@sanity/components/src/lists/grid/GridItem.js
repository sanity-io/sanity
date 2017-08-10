import React from 'react'
import cx from 'classnames'
import styles from './styles/GridItem.css'
import CoreListItem from '../core/CoreListItem'

export default function GridItem(props : {className: string}) {
  const {className, ...rest} = props
  return <CoreListItem {...rest} className={cx(styles.root, className)} />
}
