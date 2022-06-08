import {EMPTY, fromEvent} from 'rxjs'
import {shareReplay} from 'rxjs/operators'

export const orientationChange$ =
  typeof window === 'undefined'
    ? EMPTY
    : fromEvent(window, 'orientationchange').pipe(shareReplay(1))
