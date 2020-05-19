import React from 'react'
import styles from './Normal.css'
type Props = {
  children: React.ReactNode
}
export default function Normal(props: Props) {
  return <div className={styles.root}>{props.children}</div>
}
