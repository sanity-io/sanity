import {fromEvent, of} from 'rxjs'
import {debounceTime, share} from 'rxjs/operators'

export const scroll$ =
  typeof window === 'undefined'
    ? of({})
    : fromEvent(window, 'scroll', {passive: true, capture: true}).pipe(debounceTime(200), share())
