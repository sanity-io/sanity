/* eslint-disable @typescript-eslint/explicit-function-return-type */

import {Observable, merge} from 'rxjs'
import {map, share, debounceTime} from 'rxjs/operators'

const fromWindowEvent = eventName =>
  new Observable(subscriber => {
    const handler = event => subscriber.next(event)
    window.addEventListener(eventName, handler, false)
    return () => {
      window.removeEventListener(eventName, handler, false)
    }
  })

const orientationChange$ = fromWindowEvent('orientationchange')
const resize$ = fromWindowEvent('resize')

const windowWidth$ = merge(orientationChange$, resize$).pipe(
  debounceTime(50),
  map(() => window.innerWidth),
  share()
)

export default windowWidth$
