import React from 'react'
import styles from './Header.css'
import {PortableTextBlock} from '../types'

type Props = {
  block: PortableTextBlock
  children: React.ReactNode
  style: string
}
export default function Header(props: Props) {
  return <div className={styles[props.style]}>{props.children}</div>
}
