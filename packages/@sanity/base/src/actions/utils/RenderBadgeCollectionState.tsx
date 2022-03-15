import React from 'react'
import {DocumentBadgeDescription, DocumentBadgeProps} from '../../badges/types'
import {EditStateFor} from '../../datastores/document/document-pair/editState'
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
