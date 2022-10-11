import React, {useCallback, useMemo, useState} from 'react'
import {isNonNullable} from '../../util'
import {getHookId} from './actionId'
import {HookStateContainer} from './HookStateContainer'
import type {ActionHook} from './types'

/** @internal */
export interface GetHookCollectionStateProps<T, K> {
  args: T
  render: (props: {states: K[]}) => React.ReactNode
  hooks: ActionHook<T, K>[]
  onReset?: () => void
}

/** @internal */
export function GetHookCollectionState<T, K>(props: GetHookCollectionStateProps<T, K>) {
  const {hooks, args, render, onReset} = props

  const [hooksState, setHooksState] = useState<Record<string, {value: K}>>({})
  const [keys, setKeys] = useState<Record<string, number>>({})

  const handleNext = useCallback((id: any, hookState: any) => {
    if (hookState === null) {
      setHooksState((state) => {
        const nextState = {...state}
        delete nextState[id]
        return nextState
      })
    } else {
      setHooksState((state) => {
        const current = state[id]
        return {...state, [id]: {...current, value: hookState}}
      })
    }
  }, [])

  const handleReset = useCallback(
    (id: any) => {
      setKeys((currentKeys) => ({...currentKeys, [id]: (currentKeys[id] || 0) + 1}))

      if (onReset) {
        onReset()
      }
    },
    [onReset]
  )

  const hookIds = useMemo(() => hooks.map((hook) => getHookId(hook)), [hooks])

  const states = useMemo(
    () => hookIds.map((id) => hooksState[id]?.value).filter(isNonNullable),
    [hookIds, hooksState]
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
            onReset={handleReset}
          />
        )
      })}

      {render({states})}
    </>
  )
}
