import {memo, type MemoExoticComponent, type ReactNode} from 'react'
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
const RenderBadgeCollectionStateComponent = (
  props: RenderBadgeCollectionProps,
): React.JSX.Element => {
  const {badges, children, badgeProps} = props

  return (
    <GetHookCollectionState<EditStateFor, DocumentBadgeDescription>
      hooks={badges}
      args={badgeProps}
    >
      {children}
    </GetHookCollectionState>
  )
}

/** @internal */
export const RenderBadgeCollectionState: MemoExoticComponent<
  typeof RenderBadgeCollectionStateComponent
> = memo(RenderBadgeCollectionStateComponent)
RenderBadgeCollectionState.displayName = 'Memo(RenderBadgeCollectionState)'
