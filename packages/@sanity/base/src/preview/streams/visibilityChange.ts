import {fromEvent, of} from 'rxjs'
import {share} from 'rxjs/operators'

export const visibilityChange$ =
  typeof window === 'undefined'
    ? of({} as any)
    : fromEvent(document, 'visibilitychange').pipe(share())
