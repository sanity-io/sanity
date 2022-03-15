import {fromEvent, of} from 'rxjs'
import {share} from 'rxjs/operators'

export const orientationChange$ =
  typeof window === 'undefined' ? of({}) : fromEvent(window, 'orientationchange').pipe(share())
