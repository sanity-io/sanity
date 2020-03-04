import React from 'react'
import {omit} from 'lodash'
import {Subject} from 'rxjs'
import {scan, map} from 'rxjs/operators'
import shallowEquals from 'shallow-equals'

export const Context = React.createContext({
  dispatch: event => {},
  __positions$: null
})

export const PositionTracker = React.memo(function PositionTracker(props) {
  const subject = React.useMemo(() => new Subject(), [])
  const positions$ = React.useMemo(() => {
    return subject.asObservable().pipe(
      scan((prevState, event) => {
        if (event.type === 'update' || event.type === 'update') {
          if (prevState[event.key] && shallowEquals(prevState[event.key].rect, event.rect)) {
            return prevState
          }
          return {...prevState, [event.key]: {key: event.key, rect: event.rect}}
        }
        if (event.type === 'unmount') {
          return omit(prevState, event.key)
        }
      }, {}),
      map(positions => Object.values(positions))
    )
  }, [])

  const dispatch = React.useCallback(event => {
    subject.next(event)
  }, [])

  return (
    <Context.Provider value={{dispatch, __positions$: positions$}}>
      {props.children}
    </Context.Provider>
  )
})
