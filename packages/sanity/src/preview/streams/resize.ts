import {EMPTY, fromEvent} from 'rxjs'
import {shareReplay} from 'rxjs/operators'

export const resize$ =
  typeof window === 'undefined' ? EMPTY : fromEvent(window, 'resize').pipe(shareReplay(1))
