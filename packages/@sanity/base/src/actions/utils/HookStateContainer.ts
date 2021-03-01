import React from 'react'
import shallowEquals from 'shallow-equals'

function useShallowCompareMemoize(value) {
  const ref = React.useRef()
  if (!shallowEquals(value, ref.current)) {
    ref.current = value
  }
  return [ref.current]
}

function useShallowCompareEffect(callback, dependencies) {
  React.useEffect(callback, useShallowCompareMemoize(dependencies))
}

export const HookStateContainer = React.memo(
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
