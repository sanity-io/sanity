import React from 'react'
import {EditStateFor} from '../../datastores'
import {DocumentBadgeDescription, DocumentBadgeProps} from './types'
import {GetHookCollectionState} from './GetHookCollectionState'

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
