import {EMPTY, fromEvent, Observable} from 'rxjs'
import {shareReplay} from 'rxjs/operators'

export const visibilityChange$: Observable<Event> =
  typeof window === 'undefined'
    ? EMPTY
    : fromEvent(document, 'visibilitychange').pipe(shareReplay(1))
