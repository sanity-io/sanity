import React, {memo, useEffect, useRef} from 'react'
import shallowEquals from 'shallow-equals'

function useShallowCompareMemoize<T>(value: T): Array<T | undefined> {
  const ref = useRef<T | undefined>(undefined)

  if (!shallowEquals(value, ref.current)) {
    ref.current = value
  }

  return [ref.current]
}

function useShallowCompareEffect(callback: React.EffectCallback, dependencies: any) {
  useEffect(callback, useShallowCompareMemoize(dependencies))
}

export const HookStateContainer = memo(
  function HookStateContainer(props: any) {
    const {hook, args, id, onNext, onReset, onRequestUpdate} = props

    const hookState = hook({
      ...args,
      onComplete: () => {
        onReset(id)
      },
    })

    useShallowCompareEffect(() => {
      onNext(id, hookState)
      onRequestUpdate()
      return () => {
        onNext(id, null)
        onRequestUpdate()
      }
    }, hookState)

    return null
  },
  (prev, next) => prev.args === next.args
)
