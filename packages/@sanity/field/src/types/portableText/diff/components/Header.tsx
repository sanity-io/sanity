import React from 'react'
import styles from './Header.css'

type Props = {
  children: React.ReactNode
  style: string
}
export default function Header(props: Props): JSX.Element {
  return <div className={styles[props.style]}>{props.children}</div>
}
