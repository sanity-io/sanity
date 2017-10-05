import React from 'react'
import PropTypes from 'prop-types'
import styles from './UploadProgressBar.css'

export default function UploadProgressBar(props) {
  const {percent} = props
  const classes = [
    styles.root,
    percent === 100 && styles.completed
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      <div className={styles.inner}>
        <div className={styles.barContainer}>
          <div className={styles.bar} style={{width: `${percent}%`}} />
        </div>
      </div>
    </div>
  )
}

UploadProgressBar.propTypes = {
  percent: PropTypes.number
}

UploadProgressBar.defaultProps = {
  percent: 0
}
