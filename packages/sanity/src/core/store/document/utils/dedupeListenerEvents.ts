import TTLCache from '@isaacs/ttlcache'
import {type MonoTypeOperatorFunction, type Observable} from 'rxjs'
import {mergeMap, scan} from 'rxjs/operators'

import {debug} from '../debug'
import {type ListenerEvent} from '../getPairListener'

const DEFAULT_TTL = 120_000
const DEFAULT_MAX_ENTRIES = 1000

export function dedupeListenerEvents<T extends ListenerEvent>({
  ttl = DEFAULT_TTL,
  max = DEFAULT_MAX_ENTRIES,
}: {
  ttl?: number
  max?: number
} = {}): MonoTypeOperatorFunction<T> {
  return (input$: Observable<T>) =>
    input$.pipe(
      scan(
        ({seen}: {emit: T[]; seen: TTLCache<string, null>}, event: T) => {
          if (event.type !== 'mutation') {
            return {emit: [event], seen}
          }
          const key = `${event.transactionId}#${event.documentId}`
          if (seen.has(key)) {
            debug('Ignoring duplicate listener event: ', key)
            return {seen, emit: []}
          }
          seen.set(key, null)
          return {seen, emit: [event]}
        },
        {emit: [], seen: new TTLCache<string, null>({ttl, max})},
      ),
      mergeMap(
        (state) =>
          //  note: if state.emit is an empty array, nothing will be emitted
          state.emit,
      ),
    )
}
