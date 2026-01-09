import {useImperativeHandle, useMemo, useState} from 'react'

import {HookCollectionState} from './HookCollectionState'
import {type GetHookCollectionStateProps} from './types'
import {useHookCollectionStates} from './useHookCollectionStates'

/** @internal */
export function GetHookCollectionState<Args, State>(
  props: GetHookCollectionStateProps<Args, State>,
) {
  const {hooks, args, children, resetRef} = props

  const {states, handleNext} = useHookCollectionStates({hooks})

  const result = useMemo(() => children({states}), [children, states])

  /**
   * Legacy pattern that should not be used in new code
   */
  const [forceReset, setForceReset] = useState(0)
  useImperativeHandle(resetRef, () => () => setForceReset((n) => n + 1), [])

  return (
    <>
      <HookCollectionState<Args, State>
        key={`render-${forceReset}`}
        hooks={hooks}
        args={args}
        handleNext={handleNext}
      />
      {result}
    </>
  )
}
