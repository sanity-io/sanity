import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/progress/bar-style'

export default class ProgressBar extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    percent: PropTypes.number,
    animation: PropTypes.bool,
    completed: PropTypes.bool,
    text: PropTypes.string,
    showPercent: PropTypes.bool
  }

  static defaultProps = {
    completion: 0
  }

  render() {
    const {percent, completed, text, showPercent} = this.props
    const rootClasses = `
      ${completed ? styles.completed : styles.uncompleted}
      ${percent >= 100 && styles.hundredPercent}
    `
    const barStyle = {
      width: `${percent}%`
    }
    return (
      <div className={rootClasses}>
        <div className={styles.inner}>
          <div className={styles.barContainer}>
            <div className={styles.bar} style={barStyle} />
          </div>
          {
            showPercent && <div className={styles.percent}>{Math.round(percent, 1)}%</div>
          }
          {
            text && <div className={styles.text}>{text}</div>
          }
        </div>
      </div>
    )
  }
}
