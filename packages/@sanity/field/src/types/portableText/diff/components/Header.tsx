import React from 'react'
import styles from './Header.css'

export default function Header({
  style,
  children,
}: {
  style: string
  children: React.ReactNode
}): JSX.Element {
  return <div className={styles[style]}>{children}</div>
}
