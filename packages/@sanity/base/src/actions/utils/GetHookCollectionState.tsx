import {throttle} from 'lodash'
import React from 'react'
import {HookStateContainer} from './HookStateContainer'
import {cancelIdleCallback, requestIdleCallback} from './requestIdleCallback'

const actionIds = new WeakMap()

let counter = 0
const getHookId = (action) => {
  if (actionIds.has(action)) {
    return actionIds.get(action)
  }
  const id = `${action.name || action.displayName || '<anonymous>'}-${counter++}`
  actionIds.set(action, id)
  return id
}

interface Props<T, K> {
  hooks: ((args: T) => K)[]
  args: T
  component: React.ComponentProps<any> & React.Component<{state: K[]}>
  onReset?: () => void
}

function useThrottled(callback, wait, options) {
  const throttled = React.useCallback(throttle(callback, wait, options), [callback])
  React.useEffect(
    () => () => {
      throttled.flush()
    },
    []
  )
  return throttled
}

export function GetHookCollectionState<T, K>(props: Props<T, K>) {
  const {hooks, args, component: Component, onReset: propsOnReset, ...rest} = props

  const statesRef = React.useRef({})
  const [, setTick] = React.useState(0)

  const [keys, setKeys] = React.useState({})
  const mountedRef = React.useRef(true)

  React.useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const ricHandle = React.useRef(null)
  const onRequestUpdate = useThrottled(
    () => {
      if (ricHandle.current) {
        cancelIdleCallback(ricHandle.current)
      }
      ricHandle.current = requestIdleCallback(() => {
        ricHandle.current = null

        if (mountedRef.current) {
          setTick((tick) => tick + 1)
        }
      })
    },
    60,
    {trailing: true}
  )

  const onNext = React.useCallback((id, hookState) => {
    if (hookState === null) {
      delete statesRef.current[id]
    } else {
      const current = statesRef.current[id]
      statesRef.current[id] = {...current, value: hookState}
    }
  }, [])

  const onReset = React.useCallback((id) => {
    setKeys((currentKeys) => ({...currentKeys, [id]: (currentKeys[id] || 0) + 1}))
    if (propsOnReset) {
      propsOnReset()
    }
  }, [])

  const hookIds = hooks.map((hook) => getHookId(hook))

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
            onNext={onNext}
            onRequestUpdate={onRequestUpdate}
            onReset={onReset}
          />
        )
      })}

      <Component
        {...rest}
        states={hookIds.map((id) => statesRef.current[id]?.value).filter(Boolean)}
      />
    </>
  )
}
