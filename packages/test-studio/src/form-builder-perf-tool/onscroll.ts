import {share} from 'rxjs/operators'
import {fromEvent} from 'rxjs'

export const scroll$ = fromEvent(window, 'scroll', {passive: true, capture: true}).pipe(share())
