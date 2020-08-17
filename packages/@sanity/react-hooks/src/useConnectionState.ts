import documentStore from 'part:@sanity/base/datastore/document'
import {Observable, of, timer} from 'rxjs'
import {distinctUntilChanged, map, switchMap, mapTo} from 'rxjs/operators'
import {toObservable, useObservable} from './utils/useObservable'

type ConnectionState = 'connecting' | 'reconnecting' | 'connected'

const INITIAL: ConnectionState = 'connecting'

export function useConnectionState(publishedId, typeName): ConnectionState {
  return useObservable<ConnectionState>(
    toObservable({publishedId, typeName}, props$ =>
      props$.pipe(
        distinctUntilChanged((curr, next) => curr.publishedId === next.publishedId),
        switchMap(
          ({publishedId: publishedDocId, typeName: docTypeName}): Observable<ConnectionState> => {
            return documentStore.pair.documentEvents(publishedDocId, docTypeName).pipe(
              map((ev: {type: string}) => ev.type),
              map(eventType => eventType !== 'reconnect'),
              switchMap(isConnected =>
                isConnected ? of('connected') : timer(200).pipe(mapTo('reconnecting'))
              ),
              distinctUntilChanged()
            )
          }
        )
      )
    ),
    INITIAL
  )
}
