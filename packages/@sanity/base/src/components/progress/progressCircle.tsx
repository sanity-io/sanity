import React from 'react'
import {
  Root,
  StatusText,
  PercentText,
  ForegroundCircle,
  ActiveCircle,
  BackgroundCircle,
} from './progressCircle.styled'

const radiusFactor = 1.3

export interface ProgressCircleProps {
  percent?: number
  text?: string
  style?: React.CSSProperties
  showPercent?: boolean
  isComplete?: boolean
  isInProgress?: boolean
}

export const ProgressCircle: React.FunctionComponent<ProgressCircleProps> = (props) => {
  const {percent = 0, text, style, showPercent, isComplete} = props
  const radius = 50
  const strokeWidth = 10
  const width = radius * 2
  const height = radius * 2
  const viewBox = `0 0 ${width} ${height}`
  const dashArray = radius * Math.PI * 2
  const dashOffset = dashArray - (dashArray * percent) / 100

  return (
    <Root style={style}>
      <svg width={width} height={height} viewBox={viewBox}>
        <BackgroundCircle
          cx={radius}
          cy={radius}
          r={radius - strokeWidth}
          strokeWidth={`${strokeWidth}px`}
          isComplete={isComplete}
        />
        <ForegroundCircle
          cx={radius}
          cy={radius}
          r={radius - strokeWidth}
          strokeWidth={`${strokeWidth}px`}
          style={{
            strokeDasharray: dashArray,
            strokeDashoffset: dashOffset,
          }}
          isComplete={isComplete}
        />
        <ActiveCircle
          cx={radius}
          cy={radius}
          r={radius - 1}
          style={{
            strokeDasharray: Math.PI,
            strokeDashoffset: Math.PI,
          }}
          isComplete={isComplete}
        />
        {showPercent && (
          <PercentText
            x={radius}
            y={text ? radius - 5 : radius}
            dy=".4em"
            textAnchor="middle"
            isComplete={isComplete}
          >
            {`${Math.round(percent)}%`}
          </PercentText>
        )}
        {text && (
          <StatusText
            x={radius}
            y={radius * radiusFactor - 5}
            dy=".4em"
            textAnchor="middle"
            isComplete={isComplete}
          >
            {text}
          </StatusText>
        )}
      </svg>
    </Root>
  )
}
