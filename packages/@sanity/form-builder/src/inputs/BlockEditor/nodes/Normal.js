// @flow
import type {Node} from 'react'
import React from 'react'
import styles from './styles/Normal.css'

type Props = {
  attributes: {},
  children: Node
}

export default function Normal(props: Props) {
  return (
    <div className={styles.root} {...props.attributes}>
      {props.children}
    </div>
  )
}
