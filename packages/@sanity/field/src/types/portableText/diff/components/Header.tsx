import React from 'react'
import {PortableTextBlock} from '../types'
import styles from './Header.css'

type Props = {
  // eslint-disable-next-line react/no-unused-prop-types
  block: PortableTextBlock
  children: React.ReactNode
  style: string
}
export default function Header(props: Props): JSX.Element {
  return <div className={styles[props.style]}>{props.children}</div>
}
