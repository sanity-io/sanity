import {Observable, merge} from 'rxjs'
import {map, share, debounceTime} from 'rxjs/operators'

const fromWindowEvent = eventName =>
  new Observable(subscriber => {
    const handler = event => subscriber.next(event)
    window.addEventListener(eventName, handler)
    return () => {
      window.removeEventListener(eventName, handler)
    }
  })

const orientationChange$ = fromWindowEvent('orientationchange')
const resize$ = fromWindowEvent('resize')

const windowWidth$ = merge(orientationChange$, resize$).pipe(
  share(),
  debounceTime(50),
  map(() => window.innerWidth)
)

export default windowWidth$
