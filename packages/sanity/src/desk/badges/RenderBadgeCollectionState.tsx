import React from 'react'
import {GetHookCollectionState, type EditStateFor} from '../../core'
import type {DocumentBadgeDescription, DocumentBadgeProps} from './types'

interface Badge<Args, Description> {
  (args: Args): Description | null
}

interface RenderBadgeCollectionProps {
  badges: Badge<DocumentBadgeProps, DocumentBadgeDescription>[]
  badgeProps: EditStateFor
  children: (props: {states: DocumentBadgeDescription[]}) => React.ReactNode
  onActionComplete?: () => void
}

export const RenderBadgeCollectionState = (props: RenderBadgeCollectionProps) => {
  const {badges, children, badgeProps, ...rest} = props

  return (
    <GetHookCollectionState {...rest} hooks={badges} args={badgeProps}>
      {children}
    </GetHookCollectionState>
  )
}
