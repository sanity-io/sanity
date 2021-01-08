import ProgressCirclePart from 'part:@sanity/components/progress/circle'
import React from 'react'

interface Props {
  percent?: number
  text?: string
  style?: React.CSSProperties
  showPercent?: boolean
  isComplete?: boolean
  isInProgress?: boolean
}

export function ProgressCircle(props: Props) {
  return <ProgressCirclePart {...props} />
}
