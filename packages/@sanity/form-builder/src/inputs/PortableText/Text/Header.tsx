import {PortableTextBlock} from '@sanity/portable-text-editor'
import React from 'react'
import styles from './Header.css'

type Props = {
  block: PortableTextBlock
  children: React.ReactNode
}
export default function Header(props: Props) {
  return <div className={styles[props.block.style]}>{props.children}</div>
}
