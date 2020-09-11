import React from 'react'
import {PortableTextBlock} from '../types'
import styles from './Blockquote.css'

type Props = {
  // eslint-disable-next-line react/no-unused-prop-types
  block: PortableTextBlock
  children: React.ReactNode
}
export default function Blockquote(props: Props): JSX.Element {
  return (
    <div className={styles.root}>
      <blockquote className={styles.quote}>{props.children}</blockquote>
    </div>
  )
}
