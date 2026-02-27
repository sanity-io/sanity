import {memo, useMemo} from 'react'
import deepEqual from 'react-fast-compare'

import {getHookId} from './actionId'
import {defineHookStateComponent} from './defineHookStateComponent'
import {type HookCollectionActionHook} from './types'

interface HookCollectionStateProps<Args, State> {
  hooks: HookCollectionActionHook<Args, State>[]
  args: Args
  handleNext: (id: string, hookState: State | null) => void
}

const HookCollectionStateComponent = <Args, State>({
  hooks,
  args,
  handleNext,
}: HookCollectionStateProps<Args, State>) => {
  return useMemo(
    () =>
      hooks.map((hook) => {
        const id = getHookId(hook)
        return <RenderHook key={id} args={args} id={id} hook={hook} handleNext={handleNext} />
      }),
    [args, hooks, handleNext],
  )
}
HookCollectionStateComponent.displayName = 'HookCollectionState'

/** @internal */
export const HookCollectionState = memo(
  HookCollectionStateComponent,
  // react-fast-compare handles react specifis and allows us to bail on `args` values that are still the same as before, like `<>A</>`
  deepEqual,
) as <Args, State>(props: HookCollectionStateProps<Args, State>) => React.ReactNode

function RenderHook<Args, State>({
  args,
  hook,
  id,
  handleNext,
}: {
  args: Args
  hook: HookCollectionActionHook<Args, State>
  id: string
  handleNext: (id: string, hookState: State | null) => void
}) {
  const HookState = useMemo(
    () =>
      defineHookStateComponent<Args, State>({
        hook,
        id,
      }),
    [hook, id],
  )

  // eslint-disable-next-line react-hooks/static-components -- yes this is bad, but we can't fix it without a new document actions API that will be a breaking change
  return <HookState args={args} handleNext={handleNext} />
}
