import React, {SyntheticEvent} from 'react'
import styles from './Annotation.css'
import {PortableTextBlock, PortableTextChild} from '../types'

type Props = {
  block: PortableTextBlock
  children: React.ReactNode
  markDefKey: string
  onClick?: (event: SyntheticEvent<HTMLSpanElement>) => void
  span: PortableTextChild
}

export default function Annotation(props: Props) {
  const {onClick} = props

  // Click handler
  const handleClick = onClick
    ? (event: SyntheticEvent<HTMLSpanElement>) => {
        onClick(event)
      }
    : () => {}

  return (
    <span className={styles.root} onClick={handleClick}>
      {props.children}
    </span>
  )
}
