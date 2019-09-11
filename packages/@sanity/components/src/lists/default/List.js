import React from 'react'
import styles from '../styles/DefaultList.css'
import classNames from 'classnames'

export default function DefaultList(props) {
  // eslint-disable-next-line react/prop-types
  return <ul {...props} className={classNames([styles.root, props.className])} />
}
