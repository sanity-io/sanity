import React, {useEffect} from 'react'
import {
  type DocumentBadgeDescription,
  type DocumentBadgeProps,
  type EditStateFor,
  GetHookCollectionState,
} from 'sanity'

/** @internal */
export interface Badge<Args, Description> {
  (args: Args): Description | null
}

/** @internal */
export interface RenderBadgeCollectionProps {
  badges: Badge<DocumentBadgeProps, DocumentBadgeDescription>[]
  badgeProps: EditStateFor
  children: (props: {states: DocumentBadgeDescription[]}) => React.ReactNode
}

/** @internal */
export const RenderBadgeCollectionState = (props: RenderBadgeCollectionProps) => {
  const {badges, children, badgeProps} = props

  return null

  useEffect(() => {}, [])

  return (
    <GetHookCollectionState hooks={badges} args={badgeProps}>
      {children}
    </GetHookCollectionState>
  )
}
