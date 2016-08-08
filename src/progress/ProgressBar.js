import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/progress/bar'

export default class ProgressBar extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    completion: PropTypes.number,
    animation: PropTypes.bool,
    text: PropTypes.string,
    style: PropTypes.object,
    showPercent: PropTypes.bool
  }

  static defaultProps = {
    completion: 0
  }

  render() {
    const {completion, text, style, showPercent} = this.props
    const completed = completion >= 100
    const rootClasses = `
      ${completed ? styles.completed : styles.uncompleted}
    `
    const barStyle = {
      width: `${completion}%`
    }
    return (
      <div className={rootClasses} style={style}>
        <div className={styles.inner}>
          <div className={styles.barContainer}>
            <div className={styles.bar} style={barStyle} />
          </div>
          {
            showPercent && <div className={styles.percent}>{Math.round(completion, 1)}%</div>
          }
          {
            text && <div className={styles.text}>{text}</div>
          }
        </div>
      </div>
    )
  }
}
