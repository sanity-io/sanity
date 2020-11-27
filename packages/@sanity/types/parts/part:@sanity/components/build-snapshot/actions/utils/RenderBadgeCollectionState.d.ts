import * as React from 'react'
export interface Badge {
  label: string
  title: string
  color: 'success' | 'failure' | 'warning'
  icon?: React.ReactNode
}
interface RenderBadgeCollectionProps {
  badges: any[]
  badgeProps: any
  onActionComplete: () => void
  component: (args: {states: Badge[]}) => React.ReactNode
}
export declare function RenderBadgeCollectionState(props: RenderBadgeCollectionProps): JSX.Element
export {}
