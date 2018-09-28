// @flow
import type {Node} from 'react'
import React from 'react'
import styles from './styles/Blockquote.css'

type Props = {
  children: Node
}

export default function Blockquote(props: Props) {
  return (
    <div className={styles.root}>
      <blockquote className={styles.quote}>{props.children}</blockquote>
    </div>
  )
}
