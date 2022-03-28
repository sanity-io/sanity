import type React from 'react'
interface ProgressCircleProps {
  percent?: number
  text?: string
  style?: React.CSSProperties
  showPercent?: boolean
  isComplete?: boolean
  isInProgress?: boolean
}
export default class ProgressCircle extends React.PureComponent<ProgressCircleProps> {
  render(): JSX.Element
}
export {}
