import React from 'react'
import styles from './Paragraph.css'

type Props = {
  children: React.ReactNode
}

export default function Paragraph(props: Props): JSX.Element {
  return <div className={styles.root}>{props.children}</div>
}
