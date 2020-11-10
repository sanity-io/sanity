import styles from 'part:@sanity/components/progress/bar-style'
import React from 'react'

interface ProgressBarProps {
  className?: string
  percent?: number
  animation?: boolean
  isComplete?: boolean
  isInProgress?: boolean
  text?: string
  showPercent?: boolean
}

export default class ProgressBar extends React.Component<ProgressBarProps> {
  render() {
    const {percent = 0, isComplete, text, showPercent, isInProgress} = this.props

    const rootClasses = `
      ${isComplete ? styles.completed : styles.uncompleted}
      ${percent >= 100 && styles.hundredPercent}
      ${isInProgress ? styles.isInProgress : styles.isNotInProgress}
    `

    const barStyle = {
      width: `${percent}%`,
    }

    return (
      <div className={rootClasses}>
        <div className={styles.inner}>
          <div className={styles.barContainer}>
            <div className={styles.bar} style={barStyle} />
          </div>
          {showPercent && <div className={styles.percent}>{Math.round(percent)}%</div>}
          {text && <div className={styles.text}>{text}</div>}
        </div>
      </div>
    )
  }
}
