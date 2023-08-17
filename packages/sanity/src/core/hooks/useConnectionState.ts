import {distinctUntilChanged, map, mapTo, startWith, switchMap} from 'rxjs/operators'
import {of, timer} from 'rxjs'
import {useMemoObservable} from 'react-rx'
import {useDocumentStore} from '../store'

/** @internal */
export type ConnectionState = 'connecting' | 'reconnecting' | 'connected'

const INITIAL: ConnectionState = 'connecting'

/** @internal */
export function useConnectionState(publishedDocId: string, docTypeName: string): ConnectionState {
  const documentStore = useDocumentStore()

  return useMemoObservable(
    () =>
      documentStore.pair.documentEvents(publishedDocId, docTypeName).pipe(
        map((ev: {type: string}) => ev.type),
        map((eventType) => eventType !== 'reconnect'),
        switchMap((isConnected) =>
          isConnected ? of('connected') : timer(200).pipe(mapTo('reconnecting')),
        ),
        startWith(INITIAL as any),
        distinctUntilChanged(),
      ),
    [documentStore.pair, publishedDocId, docTypeName],
    INITIAL,
  )
}
