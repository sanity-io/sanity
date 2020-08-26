import React from 'react'
import FileIcon from 'part:@sanity/base/file-icon'
import styles from './FilePreview.css'

interface Props {
  value: any // TODO
  action: 'changed' | 'added' | 'removed'
  pctDiff?: number
}

export default function FilePreview({value, action = 'changed', pctDiff}: Props) {
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
            {pctDiff && pctDiff !== 0 && (
              <span className={styles.sizeDiff} data-number={pctDiff > 0 ? 'positive' : 'negative'}>
                {pctDiff > 0 && '+'}
                {pctDiff}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
