/* eslint-disable react/no-multi-comp */
import * as React from 'react'
import {GetHookCollectionState} from './GetHookCollectionState'

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

export function RenderBadgeCollectionState(props: RenderBadgeCollectionProps) {
  const {badges, component, badgeProps, ...rest} = props
  return <GetHookCollectionState {...rest} hooks={badges} args={badgeProps} component={component} />
}
