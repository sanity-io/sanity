import {EMPTY, fromEvent} from 'rxjs'
import {shareReplay} from 'rxjs/operators'

export const scroll$ =
  typeof window === 'undefined'
    ? EMPTY
    : fromEvent(window, 'scroll', {passive: true, capture: true}).pipe(shareReplay(1))
