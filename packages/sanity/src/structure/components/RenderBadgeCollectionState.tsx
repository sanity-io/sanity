import {memo, type ReactNode} from 'react'
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
