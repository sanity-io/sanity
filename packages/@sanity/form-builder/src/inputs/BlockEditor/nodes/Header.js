// @flow
import type {Node} from 'react'
import React from 'react'
import styles from './styles/Header.css'

type Props = {
  attributes: {},
  style: string,
  children: Node
}

export default function Header(props: Props) {
  return (
    <div {...props.attributes} className={`${styles.root} ${styles[props.style]}`}>
      {props.children}
    </div>
  )
}
