import type React from 'react'
import {ActionDescription, DocumentActionProps} from './types'
interface Action<Args, Description> {
  (args: Args): Description
}
interface RenderActionCollectionProps {
  actions: Action<DocumentActionProps, ActionDescription>[]
  actionProps: DocumentActionProps
  onActionComplete: () => void
  component: (args: {states: ActionDescription[]}) => React.ReactNode
}
export declare function RenderActionCollectionState(props: RenderActionCollectionProps): JSX.Element
export {}
