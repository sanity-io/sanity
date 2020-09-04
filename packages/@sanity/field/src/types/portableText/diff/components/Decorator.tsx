import React from 'react'
import styles from './Decorator.css'
import {PortableTextBlock, PortableTextChild} from '../types'

type Props = {
  block: PortableTextBlock
  children: React.ReactNode
  mark: string
  span: PortableTextChild
}
export default function Decorator(props: Props) {
  return (
    <span className={`${styles[props.mark]}`}>
      {props.children}
    </span>
  )
}
