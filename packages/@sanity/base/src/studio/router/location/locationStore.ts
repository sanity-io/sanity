import {createBrowserHistory} from 'history'
import {Observable} from 'rxjs'
import {map, share} from 'rxjs/operators'
import {isRecord} from '../../../util/isRecord'
import {LocationInterceptor, LocationEvent} from './types'
import {ActionFunctor, createAction} from './utils/action'
import {createLocationController, Location} from './utils/location'

export interface LocationStore {
  event$: Observable<LocationEvent>
  intercept: (i: LocationInterceptor) => void
  navigate: ActionFunctor<{path: string; replace?: boolean}>
}

const noop = () => undefined

export function createLocationStore(): LocationStore {
  const interceptors: LocationInterceptor[] = []
  const history = createBrowserHistory()
  const locationController = createLocationController()

  function readLocation() {
    return locationController.parse(document.location.href)
  }

  const location$ = new Observable<Location>((observer) => {
    return history.listen(() => observer.next(readLocation()))
  })

  const locationChange$ = location$.pipe(
    map((location): LocationEvent => ({type: 'change', location})),
    share()
  )

  const event$ = new Observable<LocationEvent>((observer) => {
    const subscription = locationChange$.subscribe(observer)

    observer.next({
      type: 'snapshot',
      location: readLocation(),
    })

    return subscription
  })

  const navigate = createAction(
    'navigate',
    function navigate(opts: {
      path: string
      replace?: boolean
    }): {progress: Observable<unknown>} | undefined {
      if (!isRecord(opts)) {
        throw new Error('navigation options must be an object')
      }

      const currentUrl = readLocation()

      if (interceptors.length > 0) {
        let cancelled = false

        const nextNavigation = {
          path: opts.path,
          cancel() {
            cancelled = true
          },
        }

        interceptors.some((interceptor) => {
          interceptor(nextNavigation)

          return !cancelled
        })

        if (cancelled) {
          return {progress: new Observable(noop)}
        }

        return undefined
      }

      // Make debug params sticky
      const debugParams = (currentUrl.hash || '')
        .substring(1)
        .split(';')
        .filter((param: string) => param.startsWith('_debug_'))

      const finalUrl = opts.path + (debugParams.length > 0 ? `#${debugParams.join(';')}` : '')

      if (opts?.replace) {
        history.replace(finalUrl)
      } else {
        history.push(finalUrl)
      }

      return {progress: new Observable(noop)}
    }
  )

  function intercept(interceptor: LocationInterceptor) {
    interceptors.push(interceptor)

    return () => {
      const idx = interceptors.indexOf(interceptor)

      if (idx > -1) {
        interceptors.splice(idx, 1)
      }
    }
  }

  return {event$, intercept, navigate}
}
