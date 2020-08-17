import * as React from 'react'
import {BehaviorSubject, Observable, Subject, Subscription} from 'rxjs'
import shallow from 'shallow-equals'
import {distinctUntilChanged} from 'rxjs/operators'

export function toObservable<T>(value: T): Observable<T>
export function toObservable<T, K>(
  value: T,
  setup: (props$: Observable<T>) => Observable<K>
): Observable<K>
export function toObservable<T, K>(
  value: T,
  setup?: (props$: Observable<T>) => Observable<K>
): Observable<T | K> {
  const isInitial = React.useRef(true)
  const subject = React.useRef<Subject<T>>(new BehaviorSubject(value))

  React.useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false
    } else {
      // emit only on update
      subject.current.next(value)
    }
  }, [value])
  React.useEffect(() => {
    return () => {
      return subject.current.complete()
    }
  }, [])

  const o = subject.current.asObservable().pipe(distinctUntilChanged(shallow))
  return setup ? setup(o) : o
}

const isCallable = (val: any): val is (...args: unknown[]) => unknown => typeof val === 'function'

function getValue<T>(value: T): T
function getValue<T>(value: T | (() => T)): T {
  return isCallable(value) ? value() : value
}

export function useObservable<T>(observable$: Observable<T>): T | undefined
export function useObservable<T>(observable$: Observable<T>, initialValue: T): T
export function useObservable<T>(observable$: Observable<T>, initialValue: () => T): T
export function useObservable<T>(observable$: Observable<T>, initialValue?: T): T | undefined {
  const subscription = React.useRef<Subscription>()
  const isInitial = React.useRef(true)
  const [value, setState] = React.useState<T | undefined>(() => {
    let isSync = true
    let syncVal = getValue(initialValue)
    subscription.current = observable$.subscribe(nextVal => {
      if (isSync) {
        syncVal = nextVal
      } else {
        setState(nextVal)
      }
    })
    isSync = false
    return syncVal
  })

  React.useEffect(() => {
    // when the observable$ changes after initial (possibly sync render)
    if (!isInitial.current) {
      subscription.current = observable$.subscribe(nextVal => setState(nextVal))
    }
    isInitial.current = false
    return () => {
      if (subscription.current) {
        subscription.current.unsubscribe()
      }
    }
  }, [observable$])

  return value
}

export function useObservableState<T>(): [
  Observable<T | undefined>,
  React.Dispatch<React.SetStateAction<T | undefined>>
]
export function useObservableState<T>(
  initial: T | (() => T)
): [Observable<T>, React.Dispatch<React.SetStateAction<T>>]

export function useObservableState<T>(initial?: T | (() => T)) {
  const [value, update] = React.useState<T | undefined>(initial)
  return [toObservable(value), update]
}

export function useObservableContext<T>(context: React.Context<T>): Observable<T> {
  const value = React.useContext<T>(context)
  return toObservable(value)
}
