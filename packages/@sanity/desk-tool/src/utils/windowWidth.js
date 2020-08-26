import {Observable, merge} from 'rxjs'
import {map, shareReplay, debounceTime, startWith} from 'rxjs/operators'

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
  shareReplay(1),
  startWith(window.innerWidth)
)

export default windowWidth$
