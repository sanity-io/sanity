import {memo, useEffect} from 'react'

import {type HookCollectionActionHook} from './types'

export function defineHookStateComponent<Args, State>({
  hook: useHook,
  id,
}: {
  hook: HookCollectionActionHook<
    Args & {
      onComplete: () => void
    },
    State
  >
  id: string
}) {
  const HookStateComponent = ({
    args,
    handleNext,
    handleReset,
  }: {
    args: Args
    handleNext: (id: string, hookState: any) => void
    handleReset: (id: string) => void
  }) => {
    const hookState = useHook({
      ...args,
      onComplete: () => {
        handleReset(id)
      },
    })

    useEffect(() => {
      handleNext(id, hookState)
      return () => {
        handleNext(id, null)
      }
    }, [handleNext, hookState])

    return null
  }
  // Massively helps debugging and profiling by setting the display name
  const {displayName = 'HookState'} = useHook
  HookStateComponent.displayName = displayName
  return memo(
    HookStateComponent,
    // Only re-render if the args prop changes, ignore other prop changes
    (prev, next) => prev.args === next.args,
  )
}
