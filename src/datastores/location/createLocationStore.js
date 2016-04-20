import Observable from './utils/SanityStoreObservable'
import url from './utils/url'
import {createHistory} from 'history'
import createActions from './utils/createActions'

const history = createHistory()

function readLocation() {
  return url.parse(document.location.href)
}

const interceptors = []

function navigate(nextUrl) {
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
      if (cancelled) {
        // console.log('Action was cancelled by ', interceptor)
        return false
      }
      return true
    })
    if (cancelled) {
      return {progress: new Observable(() => {})}
    }
  }
  history.push(nextUrl)
  return {progress: new Observable(() => {})}
}

export default function createLocationStore(options = {}) {

  const eventStream = new Observable(observer => {
    let firstEmitted = false
    return history.listen(() => {
      observer.next({type: firstEmitted ? 'change' : 'snapshot', location: readLocation()})
      firstEmitted = true
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
