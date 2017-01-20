import Observable from '@sanity/observable'
import Location from '../utils/Location'
import {createHistory} from 'history'
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

export default function createLocationStore(options = {}) {
  const eventStream = new Observable(observer => {
    let firstEmitted = false
    return history.listen(() => {
      firstEmitted = true
      observer.next({
        type: firstEmitted ? 'change' : 'snapshot',
        location: readLocation()
      })
    })
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
