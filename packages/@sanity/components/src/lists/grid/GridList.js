// @flow
import React from 'react'
import styles from './styles/GridList.css'
import cx from 'classnames'

export default function GridList(props : {className: string}) {
  const {className, onSortEnd, onSortStart, lockToContainerEdges, useDragHandle, ...rest} = props
  return <ul {...rest} className={cx(styles.root, className)} />
}
