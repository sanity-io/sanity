import React from 'react'
import styles from './Blockquote.css'
import {PortableTextBlock} from '../types'

type Props = {
  block: PortableTextBlock
  children: React.ReactNode
}
export default function Blockquote(props: Props) {
  return (
    <div className={styles.root}>
      <blockquote className={styles.quote}>{props.children}</blockquote>
    </div>
  )
}
