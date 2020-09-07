import styles from 'part:@sanity/components/progress/circle-style'
import React from 'react'

const radiusFactor = 1.3

interface ProgressCircleProps {
  percent?: number
  text?: string
  style?: React.CSSProperties
  showPercent?: boolean
  isComplete?: boolean
  isInProgress?: boolean
}

export default class ProgressCircle extends React.PureComponent<ProgressCircleProps> {
  render() {
    const {percent = 0, text, style, showPercent, isComplete} = this.props

    const radius = 50
    const strokeWidth = 10
    const width = radius * 2
    const height = radius * 2
    const viewBox = `0 0 ${width} ${height}`

    const dashArray = radius * Math.PI * 2
    const dashOffset = dashArray - (dashArray * percent) / 100

    return (
      <div className={isComplete ? styles.completed : styles.unCompleted} style={style}>
        <svg className={styles.svg} width={width} height={height} viewBox={viewBox}>
          <circle
            className={styles.background}
            cx={radius}
            cy={radius}
            r={radius - strokeWidth}
            strokeWidth={`${strokeWidth}px`}
          />
          <circle
            className={styles.foreground}
            cx={radius}
            cy={radius}
            r={radius - strokeWidth}
            strokeWidth={`${strokeWidth}px`}
            style={{
              strokeDasharray: dashArray,
              strokeDashoffset: dashOffset
            }}
          />
          <circle
            className={styles.activeCircle}
            cx={radius}
            cy={radius}
            r={radius - 1}
            style={{
              strokeDasharray: Math.PI,
              strokeDashoffset: Math.PI
            }}
          />
          {showPercent && (
            <text
              className={styles.percent}
              x={radius}
              y={text ? radius - 5 : radius}
              dy=".4em"
              textAnchor="middle"
            >
              {`${Math.round(percent)}%`}
            </text>
          )}
          {text && (
            <text
              className={styles.status}
              x={radius}
              y={radius * radiusFactor - 5}
              dy=".4em"
              textAnchor="middle"
            >
              {text}
            </text>
          )}
        </svg>
      </div>
    )
  }
}
