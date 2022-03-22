import type React from 'react'
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
  render(): JSX.Element
}
export {}
