import * as React from 'react'
import {from} from 'rxjs'
import {map, tap} from 'rxjs/operators'
import {currentUser$, getUser, allUsers$, listenDocRecord} from '../mockDocStateDatastore'

function useObservable(observable$, initialValue) {
  const subscription = React.useRef()
  const [value, setState] = React.useState(() => {
    let isSync = true
    let syncVal = typeof initialValue === 'undefined' ? null : initialValue
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

  React.useEffect(
    () => () => {
      if (subscription.current) {
        subscription.current.unsubscribe()
      }
    },
    []
  )

  return value
}

export function useDocument(id) {
  return useObservable(listenDocRecord(id).pipe(map(record => record.document)))
}
export function useCurrentUser() {
  return useObservable(currentUser$.pipe(tap(console.log)))
}

export function useUsers() {
  return useObservable(allUsers$)
}
export function useUser(id) {
  return useObservable(getUser(id).pipe(tap(console.log)))
}
