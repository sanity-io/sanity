// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import documentStore from 'part:@sanity/base/datastore/document'
import {distinctUntilChanged, map, mapTo, startWith, switchMap} from 'rxjs/operators'
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
        startWith(INITIAL),
        distinctUntilChanged()
      ),
    [publishedDocId, docTypeName],
    INITIAL
  )
}
