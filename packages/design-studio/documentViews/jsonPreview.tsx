import React from 'react'

import styles from './jsonPreview.css'

export function JSONPreviewDocumentView(props: any) {
  return <pre className={styles.root}>{JSON.stringify(props.document.displayed, null, 2)}</pre>
}
