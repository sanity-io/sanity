import {distinctUntilChanged, map, mapTo, startWith, switchMap} from 'rxjs/operators'
import {of, timer} from 'rxjs'
import {useMemoObservable} from 'react-rx'
import {useDatastores} from '../datastores'

type ConnectionState = 'connecting' | 'reconnecting' | 'connected'

const INITIAL: ConnectionState = 'connecting'

export function useConnectionState(publishedDocId: string, docTypeName: string): ConnectionState {
  const {documentStore} = useDatastores()

  return useMemoObservable(
    () =>
      documentStore.pair.documentEvents(publishedDocId, docTypeName).pipe(
        map((ev: {type: string}) => ev.type),
        map((eventType) => eventType !== 'reconnect'),
        switchMap((isConnected) =>
          isConnected ? of('connected') : timer(200).pipe(mapTo('reconnecting'))
        ),
        startWith(INITIAL as any),
        distinctUntilChanged()
      ),
    [publishedDocId, docTypeName],
    INITIAL
  )
}
