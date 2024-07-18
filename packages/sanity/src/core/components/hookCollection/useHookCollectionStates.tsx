import {type ThrottleSettings} from 'lodash'
import {useCallback, useRef, useState} from 'react'
import deepCompare from 'react-fast-compare'

import {isNonNullable, useThrottledCallback} from '../../util'
import {getHookId} from './actionId'
import {cancelIdleCallback, requestIdleCallback} from './requestIdleCallback'
import {type GetHookCollectionStateProps} from './types'

const throttleOptions: ThrottleSettings = {trailing: true}

function mapHooksToStates<Args, State>(
  states: Map<string, State>,
  {hooks}: Pick<GetHookCollectionStateProps<Args, State>, 'hooks'>,
) {
  return hooks
    .map((hook) => {
      const id = getHookId(hook)
      return states.get(id)
    })
    .filter(isNonNullable)
}

export function useHookCollectionStates<Args, State>({
  hooks,
  group,
}: Pick<GetHookCollectionStateProps<Args, State>, 'hooks' | 'group'>) {
  const [states] = useState(() => new Map<string, State>())
  const [snapshot, setSnapshot] = useState<NonNullable<State>[]>(() =>
    mapHooksToStates(states, {hooks}),
  )

  const timeoutRef = useRef(0)
  const updateSnapshot = useCallback(() => {
    cancelIdleCallback(timeoutRef.current)

    timeoutRef.current = requestIdleCallback(() => {
      setSnapshot(mapHooksToStates(states, {hooks}))
    })
  }, [hooks, states])

  const requestUpdateSnapshot = useThrottledCallback(
    updateSnapshot,
    60,
    throttleOptions,
  ) as typeof updateSnapshot

  const handleNext = useCallback(
    (id: string, hookState: any) => {
      let shouldUpdateSnapshot = true

      const hookGroup = hookState?.group || ['default']
      if (hookState === null || (group && !hookGroup.includes(group))) {
        states.delete(id)
      } else {
        if (states.has(id)) {
          const prev = states.get(id)
          shouldUpdateSnapshot = !deepCompare(prev, hookState)
        }
        states.set(id, hookState)
      }

      if (shouldUpdateSnapshot) {
        requestUpdateSnapshot()
      }
    },
    [group, requestUpdateSnapshot, states],
  )

  return {states: snapshot, handleNext}
}
