/** @public */
export interface HookCollectionActionHook<Args, State> {
  (args: Args): State | null
  displayName?: string | undefined
}

/** @public */
export interface GetHookCollectionStateProps<Args, State> {
  /**
   * Arguments that will be received by the action hooks, `onComplete` will be added by the HookStateContainer component.
   */
  args: Args
  children: (props: {states: State[]}) => React.ReactNode
  hooks: HookCollectionActionHook<Args & {onComplete: () => void}, State>[]
  onReset?: () => void
  /**
   * Name for the hook group. If provided, only hooks with the same group name will be included in the collection.
   */
  group?: string
}
