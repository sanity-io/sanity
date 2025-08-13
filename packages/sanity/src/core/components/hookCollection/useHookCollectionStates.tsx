import {type ThrottleSettings} from 'lodash'
import {useCallback, useRef, useState} from 'react'
import deepCompare from 'react-fast-compare'

import {isNonNullable} from '../../util/isNonNullable'
import {useThrottledCallback} from '../../util/useThrottledCallback'
import {postTask} from '../../util/postTask'
import {getHookId} from './actionId'
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

  const abortControllerRef = useRef<AbortController | null>(null)

  const updateSnapshot = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    postTask(
      () => {
        setSnapshot(mapHooksToStates(states, {hooks}))
      },
      {signal: abortControllerRef.current.signal},
    )?.catch((error) => {
      if (error.name === 'AbortError') {
        return
      }

      throw error
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
