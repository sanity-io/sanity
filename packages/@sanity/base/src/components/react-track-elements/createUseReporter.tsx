import * as React from 'react'
import {TrackerContext} from './types'

export type ReporterHook<Payload> = (
  id: string,
  value: Payload | (() => Payload),
  isEqual?: (a: Payload, b: Payload) => boolean
) => void

function isFunc<T>(value: T | (() => T)): value is () => T {
  return typeof value === 'function'
}

function read<T>(value: T | (() => T)): T {
  return isFunc(value) ? value() : value
}

export type IsEqualFunction<Value> = (a: Value, b: Value) => boolean

export function createUseReporter<Value>(
  Context: React.Context<TrackerContext<Value>>
): ReporterHook<Value> {
  return function useReporter(
    id: string,
    value: Value | (() => Value),
    isEqual: IsEqualFunction<Value> = Object.is
  ) {
    const {add, update, remove} = React.useContext(Context)
    const previous = React.useRef<Value>()
    React.useLayoutEffect(() => {
      const current = read(value)
      add(id, current)
      previous.current = current
      return () => {
        remove(id)
      }
    }, [id])

    React.useLayoutEffect(() => {
      const current = read(value)
      if (typeof previous.current !== 'undefined' && !isEqual(previous.current, current)) {
        update(id, current)
      }
      previous.current = current
    })
  }
}
