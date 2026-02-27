/** @public */
export interface HookCollectionActionHook<Args, State> {
  (args: Args): State | null
  displayName?: string | undefined
  action?: string
}

/** @public */
export interface GetHookCollectionStateProps<Args, State> {
  args: Args
  children: (props: {states: State[]}) => React.ReactNode
  hooks: HookCollectionActionHook<Args, State>[]

  /**
   * Force hooks state to reset, this pattern is discouraged and only supported for Document Actions for backwards compatibility.
   */
  resetRef?: React.Ref<() => void>
}
