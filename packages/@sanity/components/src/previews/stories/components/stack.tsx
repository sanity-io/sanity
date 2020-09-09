import React from 'react'

import styles from './stack.css'

export function Stack(props) {
  return <div className={styles.root}>{props.children}</div>
}
