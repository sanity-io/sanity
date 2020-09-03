import React from 'react'
import styles from './Paragraph.css'
import {PortableTextBlock} from '../types'

type Props = {
  block: PortableTextBlock
  children: React.ReactNode
}

export default function Paragraph(props: Props) {
  return <div className={styles.root}>{props.children}</div>
}
