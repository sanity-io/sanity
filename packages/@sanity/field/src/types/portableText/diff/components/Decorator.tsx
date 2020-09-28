import React from 'react'
import styles from './Decorator.css'

export default function Decorator({mark, children}: {mark: string; children: JSX.Element}) {
  return <span className={`${styles[mark]}`}>{children}</span>
}
