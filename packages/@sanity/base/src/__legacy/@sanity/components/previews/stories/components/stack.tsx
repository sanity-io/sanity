import React from 'react'

import styles from './stack.css'

export function Stack(props: {children: React.ReactNode}) {
  return <div className={styles.root}>{props.children}</div>
}
