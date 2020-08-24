import documentStore from 'part:@sanity/base/datastore/document'
import {useObservable} from './utils/use-observable'
import {distinctUntilChanged, map, mapTo, switchMap} from 'rxjs/operators'
import {of, timer} from 'rxjs'
import React from 'react'

type ConnectionState = 'connecting' | 'reconnecting' | 'connected'

const INITIAL: ConnectionState = 'connecting'

export function useConnectionState(publishedId, typeName): ConnectionState {
  return useObservable<ConnectionState>(
    React.useMemo(
      () =>
        documentStore.pair.documentEvents(publishedId, typeName).pipe(
          map((ev: {type: string}) => ev.type),
          map(eventType => eventType !== 'reconnect'),
          switchMap(isConnected =>
            isConnected ? of('connected') : timer(200).pipe(mapTo('reconnecting'))
          ),
          distinctUntilChanged()
        ),
      [publishedId, typeName]
    ),
    INITIAL
  )
}
