import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/progress/circle-style'

const radiusFactor = 1.3
const widthFactor = 1.2
const heightFactor = 1.2

export default class ProgressCircle extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    percent: PropTypes.number,
    animation: PropTypes.bool,
    text: PropTypes.string,
    style: PropTypes.object,
    showPercent: PropTypes.bool,
    radius: React.PropTypes.number,
    strokeWidth: React.PropTypes.number,
    status: React.PropTypes.string,
    completed: React.PropTypes.bool
  }

  static defaultProps = {
    radius: 50,
    percentage: 0,
    strokeWidth: 10
  }

  render() {
    const {percent, completed, text, style, showPercent, radius, strokeWidth} = this.props
    const rootClasses = `
      ${completed ? styles.completed : styles.uncompleted}
      ${percent >= 100 && styles.hundredPercent}
    `

    const width = radius * 2
    const height = radius * 2
    const viewBox = `-10 -10 ${width * widthFactor} ${height * heightFactor}`

    const dashArray = this.props.radius * Math.PI * 2
    const dashOffset = dashArray - dashArray * percent / 100 //eslint-disable-line no-mixed-operators

    return (
      <div className={rootClasses} style={style}>
        <div className={styles.inner}>

          <svg
            className={styles.svg}
            width={width}
            height={height}
            viewBox={viewBox}
          >
            <circle
              className={styles.background}
              cx={radius}
              cy={radius}
              r={radius}
              strokeWidth={`${strokeWidth}px`}
            />
            <circle
              className={styles.foreground}
              cx={radius}
              cy={radius}
              r={radius}
              strokeWidth={`${strokeWidth}px`}
              style={{
                strokeDasharray: dashArray,
                strokeDashoffset: dashOffset
              }}
            />
            {
              showPercent && <text
                className={styles.percent}
                x={radius}
                y={radius}
                dy=".4em"
                textAnchor="middle"
              >
                {`${Math.round(percent, 1)}%`}
              </text>
            }
            {
              text && <text
                className={styles.status}
                x={radius}
                y={radius * radiusFactor}
                dy=".4em"
                textAnchor="middle"
              >{text}</text>
            }
          </svg>
        </div>
      </div>
    )
  }
}
