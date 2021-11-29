import React from 'react'
import type {DocumentBadgeComponent, DocumentBadgeDescription} from '../../badges/types'
import type {EditStateFor} from '../../datastores/document/document-pair/editState'
import {GetHookCollectionState} from './GetHookCollectionState'

interface RenderBadgeCollectionProps {
  badges: DocumentBadgeComponent[]
  badgeProps: EditStateFor
  onActionComplete: () => void
  component: (args: {states: DocumentBadgeDescription[]}) => React.ReactNode
}

export function RenderBadgeCollectionState(props: RenderBadgeCollectionProps) {
  const {badges, component, badgeProps, ...rest} = props
  return <GetHookCollectionState {...rest} hooks={badges} args={badgeProps} component={component} />
}
