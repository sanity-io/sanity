import React from 'react'
import styles from './Paragraph.css'

export default function Paragraph({children}: {children: React.ReactNode}): JSX.Element {
  return <div className={styles.root}>{children}</div>
}
