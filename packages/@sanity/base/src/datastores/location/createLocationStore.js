import Observable from '@sanity/observable'
import Location from '../utils/Location'
import createHistory from 'history/createBrowserHistory'
import createActions from '../utils/createActions'

const noop = () => {} // eslint-disable-line no-empty-function
const history = createHistory()

function readLocation() {
  return Location.parse(document.location.href)
}

const interceptors = []

function navigate(nextUrl, options) {
  if (interceptors.length > 0) {
    let cancelled = false
    const nextNavigation = {
      nextUrl: nextUrl,
      cancel() {
        cancelled = true
      }
    }

    interceptors.some(interceptor => {
      interceptor(nextNavigation)
      return !cancelled
    })

    if (cancelled) {
      return {progress: new Observable(noop)}
    }
  }

  if (options.replace) {
    history.replace(nextUrl)
  } else {
    history.push(nextUrl)
  }
  return {progress: new Observable(noop)}
}

const locationChange$ = new Observable(observer => {
  return history.listen(() => observer.next(readLocation()))
})
  .map(location => ({
    type: 'change',
    location: location
  }))
  .share()

export default function createLocationStore(options = {}) {
  const eventStream = new Observable(observer => {
    observer.next({
      type: 'snapshot',
      location: readLocation()
    })
    return locationChange$.subscribe(observer)
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
      navigate
    })
  }
}
