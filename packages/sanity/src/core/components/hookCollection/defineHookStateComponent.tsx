import {useEffect} from 'react'

import {type HookCollectionActionHook} from './types'

export function defineHookStateComponent<Args, State>({
  hook: useHook,
  id,
}: {
  hook: HookCollectionActionHook<Args, State>
  id: string
}) {
  const HookStateComponent = ({
    args,
    handleNext,
  }: {
    args: Args
    handleNext: (id: string, hookState: State | null) => void
  }) => {
    const hookState = useHook(args)

    useEffect(() => {
      if (hookState) {
        handleNext(id, {...hookState, action: useHook.action})
      } else {
        handleNext(id, hookState)
      }
    }, [handleNext, hookState])

    return null
  }
  // Massively helps debugging and profiling by setting the display name
  const {displayName = id.replace(/-[0-9]+$/, '')} = useHook
  HookStateComponent.displayName = displayName
  return HookStateComponent
}
