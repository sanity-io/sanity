import React from 'react'
import PropTypes from 'prop-types'
import styles from './UploadProgressBar.css'

export default function UploadProgressBar(props) {
  const {progress} = props
  const classes = [
    styles.root,
    progress === 100 && styles.completed
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      <div className={styles.inner}>
        <div className={styles.barContainer}>
          <div className={styles.bar} style={{width: `${progress}%`}} />
        </div>
      </div>
    </div>
  )
}

UploadProgressBar.propTypes = {
  progress: PropTypes.number
}

UploadProgressBar.defaultProps = {
  progress: 0
}
