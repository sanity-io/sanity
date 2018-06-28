// @flow
import React from 'react'
import styles from '../styles/DefaultListItem.css'
import classNames from 'classnames'

export default function CoreListItem(props: any) {
  return <li {...props} className={classNames([styles.root, props.className])} />
}
