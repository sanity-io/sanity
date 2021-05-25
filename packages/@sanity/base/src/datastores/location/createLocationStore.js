import {Observable} from 'rxjs'
import {map, share} from 'rxjs/operators'

import {createBrowserHistory} from 'history'
import Location from '../utils/Location'
import createActions from '../utils/createActions'

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {}
const history = createBrowserHistory()

function readLocation() {
  return Location.parse(document.location.href)
}

const interceptors = []

function navigate(nextUrl, options) {
  const currentUrl = readLocation()

  if (interceptors.length > 0) {
    let cancelled = false
    const nextNavigation = {
      nextUrl: nextUrl,
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
  }

  // make debug params sticky
  const debugParams = (currentUrl.hash || '')
    .substring(1)
    .split(';')
    .filter((param) => param.startsWith('_debug_'))

  const finalUrl = nextUrl + (debugParams.length > 0 ? `#${debugParams.join(';')}` : '')
  if (options.replace) {
    history.replace(finalUrl)
  } else {
    history.push(finalUrl)
  }
  return {progress: new Observable(noop)}
}

const locationChange$ = new Observable((observer) => {
  return history.listen(() => observer.next(readLocation()))
}).pipe(
  map((location) => ({
    type: 'change',
    location: location,
  })),
  share()
)

export default function createLocationStore(options = {}) {
  const eventStream = new Observable((observer) => {
    const subscription = locationChange$.subscribe(observer)
    observer.next({
      type: 'snapshot',
      location: readLocation(),
    })
    return subscription
  })

  return {
    state: eventStream,
    intercept(interceptor) {
      interceptors.push(interceptor)
      return () => {
        interceptors.splice(interceptors.indexOf(interceptor), 1)
      }
    },
    actions: createActions({
      navigate,
    }),
  }
}
