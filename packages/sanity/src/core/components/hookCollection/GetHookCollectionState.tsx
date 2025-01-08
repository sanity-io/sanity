import {memo, useMemo} from 'react'

import {HookCollectionState} from './HookCollectionState'
import {type GetHookCollectionStateProps} from './types'
import {useHookCollectionKeys} from './useHookCollectionKeys'
import {useHookCollectionStates} from './useHookCollectionStates'

const GetHookCollectionStateComponent = memo(
  <Args, State>(props: GetHookCollectionStateProps<Args, State>) => {
    const {hooks, args, children, group, onReset} = props

    const {handleReset, keys} = useHookCollectionKeys(onReset)
    const {states, handleNext} = useHookCollectionStates({hooks, group})

    const result = useMemo(() => children({states}), [children, states])

    return (
      <>
        <HookCollectionState
          hooks={hooks as any}
          keys={keys}
          args={args}
          handleNext={handleNext}
          handleReset={handleReset}
        />
        {result}
      </>
    )
  },
)
GetHookCollectionStateComponent.displayName = 'Memo(GetHookCollectionState)'

/** @internal */
export const GetHookCollectionState = GetHookCollectionStateComponent as <Args, State>(
  props: GetHookCollectionStateProps<Args, State>,
) => React.JSX.Element
