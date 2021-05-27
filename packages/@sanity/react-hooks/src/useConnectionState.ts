import documentStore from 'part:@sanity/base/datastore/document'
import {distinctUntilChanged, map, mapTo, switchMap} from 'rxjs/operators'
import {of, timer} from 'rxjs'
import {useMemoObservable} from 'react-rx'

type ConnectionState = 'connecting' | 'reconnecting' | 'connected'

const INITIAL: ConnectionState = 'connecting'

export function useConnectionState(publishedDocId: string, docTypeName: string): ConnectionState {
  return useMemoObservable(
    () =>
      documentStore.pair.documentEvents(publishedDocId, docTypeName).pipe(
        map((ev: {type: string}) => ev.type),
        map((eventType) => eventType !== 'reconnect'),
        switchMap((isConnected) =>
          isConnected ? of('connected') : timer(200).pipe(mapTo('reconnecting'))
        ),
        distinctUntilChanged()
      ),
    [publishedDocId, docTypeName],
    INITIAL
  )
}
