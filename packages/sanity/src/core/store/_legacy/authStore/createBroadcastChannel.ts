import {fromEvent, merge, Observable, of, Subject} from 'rxjs'
import {filter, map, shareReplay} from 'rxjs/operators'
import {isNonNullable} from '../../../util'
import * as storage from './storage'

export interface BroadcastChannel<T> {
  messages: Observable<T>
  broadcast: (message: T) => void
}

export function createBroadcastChannel<T>(namespace: string): BroadcastChannel<T> {
  const storageEvents$ =
    typeof window === 'undefined'
      ? of<StorageEvent>() // No storage events in non-browser environments
      : fromEvent<StorageEvent>(window, 'storage')

  const storageKey = `__studio_local_storage_messaging_${namespace}`

  // note: the the `storageEvents$` stream does not emit for the current
  // window/tab. this subject is used to re-broadcast messages broadcast outward
  // to itself
  const broadcastedMessages$ = new Subject<T>()

  const messages$ = merge(
    broadcastedMessages$,
    storageEvents$.pipe(
      filter((event) => event.key === storageKey),
      map((event) => event.newValue),
      filter(isNonNullable),
      map((newValue) => JSON.parse(newValue))
    )
  ).pipe(
    // this is important to ensure all new subscribers get a message on subscribe
    shareReplay(1)
  )

  function broadcast(message: T) {
    try {
      storage.setItem(storageKey, JSON.stringify(message))
      // clear the value afterwards so that next message will still emit a
      // new event even if it's identical to the previous one
      storage.removeItem(storageKey)

      broadcastedMessages$.next(message)
    } catch (err) {
      // intentional noop
    }
  }

  return {messages: messages$, broadcast}
}
