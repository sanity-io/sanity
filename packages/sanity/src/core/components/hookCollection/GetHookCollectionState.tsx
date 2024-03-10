import {type ThrottleSettings} from 'lodash'
import {type ReactNode, useCallback, useMemo, useRef, useState} from 'react'

import {isNonNullable, useThrottledCallback} from '../../util'
import {getHookId} from './actionId'
import {HookStateContainer} from './HookStateContainer'
import {cancelIdleCallback, requestIdleCallback} from './requestIdleCallback'
import {type ActionHook} from './types'

/** @internal */
export interface GetHookCollectionStateProps<T, K> {
  /**
   * Arguments that will be received by the action hooks, `onComplete` will be added by the HookStateContainer component.
   */
  args: T
  children: (props: {states: K[]}) => ReactNode
  hooks: ActionHook<T & {onComplete: () => void}, K>[]
  onReset?: () => void
  /**
   * Name for the hook group. If provided, only hooks with the same group name will be included in the collection.
   */
  group?: string
}

const throttleOptions: ThrottleSettings = {trailing: true}

/** @internal */
export function GetHookCollectionState<T, K>(props: GetHookCollectionStateProps<T, K>) {
  const {hooks, args, children, group, onReset} = props

  const statesRef = useRef<Record<string, {value: K}>>({})
  const [tickId, setTick] = useState(0)

  const [keys, setKeys] = useState<Record<string, number>>({})

  const ricHandle = useRef<number | null>(null)

  const handleRequestUpdate = useCallback(() => {
    if (ricHandle.current) {
      cancelIdleCallback(ricHandle.current)
    }

    ricHandle.current = requestIdleCallback(() => {
      ricHandle.current = null

      setTick((tick) => tick + 1)
    })
  }, [])

  const handleRequestUpdateThrottled = useThrottledCallback(
    handleRequestUpdate,
    60,
    throttleOptions,
  )

  const handleNext = useCallback(
    (id: any, hookState: any) => {
      const hookGroup = hookState?.group || ['default']
      if (hookState === null || (group && !hookGroup.includes(group))) {
        delete statesRef.current[id]
      } else {
        const current = statesRef.current[id]
        statesRef.current[id] = {...current, value: hookState}
      }
    },
    [group],
  )

  const handleReset = useCallback(
    (id: any) => {
      setKeys((currentKeys) => ({...currentKeys, [id]: (currentKeys[id] || 0) + 1}))

      if (onReset) {
        onReset()
      }
    },
    [onReset],
  )

  const hookIds = useMemo(() => hooks.map((hook) => getHookId(hook)), [hooks])
  const states = useMemo(
    () => hookIds.map((id) => statesRef.current[id]?.value).filter(isNonNullable),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tickId is used to refresh the memo, before it can be removed it needs to be investigated what impact it has
    [hookIds, tickId],
  )

  return (
    <>
      {hooks.map((hook) => {
        const id = getHookId(hook)
        const key = keys[id] || 0

        return (
          <HookStateContainer
            key={`${id}-${key}`}
            hook={hook}
            id={id}
            args={args}
            onNext={handleNext}
            onRequestUpdate={handleRequestUpdateThrottled}
            onReset={handleReset}
          />
        )
      })}

      {children({states})}
    </>
  )
}
