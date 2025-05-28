import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {of, timer} from 'rxjs'
import {distinctUntilChanged, map, mapTo, startWith, switchMap} from 'rxjs/operators'

import {useDocumentStore} from '../store'

/** @internal */
export type ConnectionState = 'connecting' | 'reconnecting' | 'connected'

const INITIAL: ConnectionState = 'connecting'

/** @internal */
export function useConnectionState(
  publishedDocId: string,
  docTypeName: string,
  version?: string,
): ConnectionState {
  const documentStore = useDocumentStore()

  const observable = useMemo(
    () =>
      documentStore.pair.documentEvents(publishedDocId, docTypeName, version).pipe(
        map((ev: {type: string}) => ev.type),
        map((eventType) => eventType !== 'reconnect'),
        switchMap((isConnected) =>
          isConnected ? of('connected') : timer(200).pipe(mapTo('reconnecting')),
        ),
        startWith(INITIAL as any),
        distinctUntilChanged(),
      ),
    [docTypeName, documentStore.pair, publishedDocId, version],
  )
  return useObservable(observable, INITIAL)
}
