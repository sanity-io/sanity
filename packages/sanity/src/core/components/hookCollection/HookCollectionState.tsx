import {memo, useMemo} from 'react'

import {getHookId} from './actionId'
import {defineHookStateComponent} from './defineHookStateComponent'
import {type HookCollectionActionHook} from './types'

export const HookCollectionState = memo(
  <T, K>({
    hooks,
    keys,
    args,
    handleNext,
    handleReset,
  }: {
    hooks: HookCollectionActionHook<T & {onComplete: () => void}, K>[]
    keys: Record<string, number>
    args: T
    handleNext: (id: string, hookState: any) => void
    handleReset: (id: string) => void
  }) => {
    const HooksState = useMemo(() => {
      return hooks.map((hook) => {
        const id = getHookId(hook)
        const key = keys[id] || 0

        return [
          defineHookStateComponent<T, K>({
            hook,
            id,
          }),
          `${id}-${key}`,
        ] as const
      })
    }, [hooks, keys])

    return (
      <>
        {HooksState.map(([HookState, key]) => (
          <HookState key={key} args={args} handleNext={handleNext} handleReset={handleReset} />
        ))}
      </>
    )
  },
)
HookCollectionState.displayName = 'Memo(HookCollectionState)'
