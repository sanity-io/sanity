import {type Context as ReactContext, useContext, useLayoutEffect, useRef} from 'react'

import {type TrackerContext} from './types'

/** @internal */
export type ReporterHook<Payload> = (
  id: string | null,
  value: Payload | (() => Payload),
  isEqual?: (a: Payload, b: Payload) => boolean,
) => void

function isFunc<T>(value: T | (() => T)): value is () => T {
  return typeof value === 'function'
}

function read<T>(value: T | (() => T)): T {
  return isFunc(value) ? value() : value
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => undefined

/** @internal */
export type IsEqualFunction<Value> = (a: Value, b: Value) => boolean

/** @internal */
export function createUseReporter<Value>(
  Context: ReactContext<TrackerContext<Value>>,
): ReporterHook<Value> {
  return function useReporter(
    // No reporting will happen if id=null
    id: string | null,
    value: Value | (() => Value),
    isEqual: IsEqualFunction<Value> = Object.is,
  ) {
    const {add, update, remove} = useContext(Context)
    const previous = useRef<Value>()

    useLayoutEffect(() => {
      if (id === null) {
        return noop
      }
      const current = read(value)
      add(id, current)
      previous.current = current
      return () => {
        remove(id)
      }
    }, [add, id, remove, value])

    useLayoutEffect(() => {
      const current = read(value)
      if (
        typeof previous.current !== 'undefined' &&
        !isEqual(previous.current, current) &&
        id !== null
      ) {
        update(id, current)
      }
      previous.current = current
    })
  }
}
