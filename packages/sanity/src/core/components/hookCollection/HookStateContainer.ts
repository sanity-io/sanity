import shallowEquals from 'shallow-equals'
import {memo, useEffect, useRef, useDeferredValue} from 'react'

/** @internal */
export const HookStateContainer = memo(
  function HookStateContainer(props: any) {
    const {hook, args, id, onNext, onReset} = props

    const hookState = hook({
      ...args,
      onComplete: () => {
        onReset(id)
      },
    })
    // let React defer (similar to requestIdleCallback) the hook state should the render pipeline be super busy atm
    const deferredHookState = useDeferredValue(hookState)
    const hookStateRef = useRef(null)

    // eslint-disable-next-line consistent-return
    useEffect(() => {
      if (!shallowEquals(deferredHookState, hookStateRef.current)) {
        hookStateRef.current = deferredHookState
        onNext(id, deferredHookState)
        return () => {
          hookStateRef.current = null
          onNext(id, null)
        }
      }
    }, [deferredHookState, id, onNext])

    return null
  },
  (prev, next) => prev.args === next.args
)
