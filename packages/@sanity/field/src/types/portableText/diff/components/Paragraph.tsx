import React from 'react'
import {PortableTextBlock} from '../types'
import styles from './Paragraph.css'

type Props = {
  // eslint-disable-next-line react/no-unused-prop-types
  block: PortableTextBlock
  children: React.ReactNode
}

export default function Paragraph(props: Props): JSX.Element {
  return <div className={styles.root}>{props.children}</div>
}
