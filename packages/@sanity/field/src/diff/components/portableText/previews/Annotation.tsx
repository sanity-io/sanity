import React from 'react'
import styles from './Annotation.css'

type Props = {
  children: React.ReactNode
}

export default function Annotation(props: Props) {
  return <span className={styles.root}>{props.children}</span>
}
