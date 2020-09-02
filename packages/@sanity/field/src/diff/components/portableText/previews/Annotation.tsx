import React from 'react'
import styles from './Annotation.css'
import {PortableTextBlock, PortableTextChild} from '../types'

type Props = {
  block: PortableTextBlock
  children: React.ReactNode
  markDefKey: string
  span: PortableTextChild
}

export default function Annotation(props: Props) {
  return (
    <span key={`annotation-${props.markDefKey}-${props.span._key}`} className={styles.root}>
      {props.children}
    </span>
  )
}
