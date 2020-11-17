import React from 'react'
import styles from './UploadProgressBar.module.css'

interface Props {
  progress: number
}

export default function UploadProgressBar(props: Props) {
  const {progress} = props

  return (
    <div className={styles.root}>
      <div className={styles.inner}>
        <div className={styles.barContainer}>
          <div className={styles.bar} style={{width: `${progress}%`}} />
        </div>
      </div>
    </div>
  )
}
