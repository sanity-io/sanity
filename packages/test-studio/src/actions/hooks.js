import * as React from 'react'
import {map} from 'rxjs/operators'
import {allUsers$, currentUser$, getUser, listenDocRecord} from '../mockDocStateDatastore'

export function useObservable(getObservable, initialValue, deps = []) {
  const subscription = React.useRef()
  const isDidMount = React.useRef(true)
  const [value, setState] = React.useState(() => {
    let isSync = true
    let syncVal = typeof initialValue === 'undefined' ? null : initialValue
    subscription.current = getObservable(deps).subscribe(nextVal => {
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
    if (!isDidMount.current && subscription.current) {
      subscription.current.unsubscribe()
      subscription.current = getObservable(deps).subscribe(next => setState(next))
    }
    isDidMount.current = false
    return () => {
      if (subscription.current) {
        subscription.current.unsubscribe()
      }
    }
  }, deps)

  return value
}

export function useDocument(id) {
  return useObservable(listenDocRecord(id).pipe(map(docInfo => docInfo.document)))
}

export function useCurrentUser() {
  return useObservable(currentUser$)
}

export function useUsers() {
  return useObservable(allUsers$)
}

export function useUser(id) {
  return useObservable(getUser(id))
}
