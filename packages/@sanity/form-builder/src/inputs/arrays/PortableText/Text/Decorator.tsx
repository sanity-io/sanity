import React from 'react'
import styles from './Decorator.css'

type Props = {
  mark: string
  children: React.ReactNode
}
export default function Decorator(props: Props) {
  return <span className={`${styles.root} ${styles[props.mark]}`}>{props.children}</span>
}
