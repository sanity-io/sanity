import React from 'react'
import styles from './styles/Decorator.css'

type Props = {
  attributes: {}
  mark: {
    type: string
  }
  children: React.ReactNode
}
export default function Decorator(props: Props) {
  return (
    <span className={`${styles.root} ${styles[props.mark.type]}`} {...props.attributes}>
      {props.children}
    </span>
  )
}
