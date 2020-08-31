import React from 'react'
import styles from './Header.css'

type Props = {
  style: string
  children: React.ReactNode
}
export default function Header(props: Props) {
  return <div className={styles[props.style]}>{props.children}</div>
}
