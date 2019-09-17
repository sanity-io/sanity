/* eslint-disable react/prop-types */
import React from 'react'
import styles from './styles/GridList.css'
import cx from 'classnames'

export default function GridList(props) {
  const {className, onSortEnd, onSortStart, lockToContainerEdges, useDragHandle, ...rest} = props
  return <ul {...rest} className={cx(styles.root, className)} />
}
