// @flow
import React from 'react'
import styles from './styles/GridList.css'
import cx from 'classnames'

export default function GridList(props : {className: string}) {
  const {className, ...rest} = props
  return <ul {...rest} className={cx(styles.root, className)} />
}
