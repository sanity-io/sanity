import React from 'react'
import {PortableTextBlock, PortableTextChild} from '../types'
import styles from './Decorator.css'

type Props = {
  // eslint-disable-next-line react/no-unused-prop-types
  block: PortableTextBlock
  children: React.ReactNode
  mark: string
  // eslint-disable-next-line react/no-unused-prop-types
  span: PortableTextChild
}
export default function Decorator(props: Props): JSX.Element {
  return <span className={`${styles[props.mark]}`}>{props.children}</span>
}
