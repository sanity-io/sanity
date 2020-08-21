import React from 'react'
import FileIcon from 'part:@sanity/base/file-icon'
import styles from './FilePreview.css'

interface Props {
  value: any // TODO
  action: 'changed' | 'added' | 'removed'
}

export default function FilePreview({value, action = 'changed'}: Props) {
  const title = value.originalFilename || 'Untitled'
  return (
    <div className={styles.root}>
      <div className={styles.meta} data-action={action}>
        <div className={styles.icon} title={action}>
          <FileIcon />
        </div>
        <div className={styles.info}>
          <h3 className={styles.title} title={title}>
            {title}
          </h3>
          <div>
            <span>{action}</span>
            {action === 'changed' && <span>{value.size}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
