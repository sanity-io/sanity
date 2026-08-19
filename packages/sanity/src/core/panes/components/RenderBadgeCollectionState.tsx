import {memo, type ReactNode} from 'react'

import {GetHookCollectionState} from '../../components/hookCollection/GetHookCollectionState'
import {type DocumentBadgeDescription, type DocumentBadgeProps} from '../../config/document/badges'
import {type EditStateFor} from '../../store/document/document-pair/editState'

/** @internal */
export interface Badge<Args, Description> {
  (args: Args): Description | null
}

/** @internal */
export interface RenderBadgeCollectionProps {
  badges: Badge<DocumentBadgeProps, DocumentBadgeDescription>[]
  badgeProps: EditStateFor
  children: (props: {states: DocumentBadgeDescription[]}) => ReactNode
}

/** @internal */
export const RenderBadgeCollectionState = memo((props: RenderBadgeCollectionProps) => {
  const {badges, children, badgeProps} = props

  return (
    <GetHookCollectionState<EditStateFor, DocumentBadgeDescription>
      hooks={badges}
      args={badgeProps}
    >
      {children}
    </GetHookCollectionState>
  )
})
RenderBadgeCollectionState.displayName = 'Memo(RenderBadgeCollectionState)'
