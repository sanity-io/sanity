import {fromEvent, of} from 'rxjs'
import {debounceTime, share} from 'rxjs/operators'

export const resize$ =
  typeof window === 'undefined'
    ? of({})
    : fromEvent(window, 'resize', {passive: true}).pipe(debounceTime(200), share())
