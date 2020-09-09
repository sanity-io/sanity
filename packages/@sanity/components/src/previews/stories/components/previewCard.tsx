import React from 'react'

import styles from './previewCard.css'

export function PreviewCard(props: {children: React.ReactNode}) {
  return <div className={styles.root}>{props.children}</div>
}
