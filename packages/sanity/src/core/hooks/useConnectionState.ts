import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {of, timer} from 'rxjs'
import {distinctUntilChanged, map, mapTo, startWith, switchMap} from 'rxjs/operators'

import {useDocumentStore} from '../store'
import {useDocumentTarget} from './useDocumentTarget'

/** @internal */
export type ConnectionState = 'connecting' | 'reconnecting' | 'connected'

const INITIAL: ConnectionState = 'connecting'

/** @internal */
export function useConnectionState(
  publishedDocId: string,
  _docTypeName: string,
  _version?: string,
): ConnectionState {
  const documentStore = useDocumentStore()
  const documentTarget = useDocumentTarget(publishedDocId)

  const observable = useMemo(
    () =>
      documentStore.document.documentEvents(documentTarget).pipe(
        map((ev: {type: string}) => ev.type),
        map((eventType) => eventType !== 'reconnect'),
        switchMap((isConnected) =>
          isConnected ? of('connected') : timer(200).pipe(mapTo('reconnecting')),
        ),
        startWith(INITIAL as any),
        distinctUntilChanged(),
      ),
    [documentTarget, documentStore.document],
  )
  return useObservable(observable, INITIAL)
}
