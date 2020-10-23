import {Observable, BehaviorSubject} from 'rxjs'
import config from 'config:@sanity/google-maps-input'

const callbackName = '___sanity_googleMapsApiCallback'
const authFailureCallbackName = 'gm_authFailure'
const locale = (typeof window !== 'undefined' && window.navigator.language) || 'en'

export interface LoadingState {
  loadState: 'loading'
}

export interface LoadedState {
  loadState: 'loaded'
  api: typeof window.google.maps
}

export interface LoadErrorState {
  loadState: 'loadError'
  error: Error
}

export interface AuthErrorState {
  loadState: 'authError'
}

export type GoogleLoadState = LoadingState | LoadedState | LoadErrorState | AuthErrorState

let subject: BehaviorSubject<GoogleLoadState>

export function loadGoogleMapsApi(): Observable<GoogleLoadState> {
  const selectedLocale = locale || 'en-US'

  if (subject) {
    return subject
  }

  subject = new BehaviorSubject<GoogleLoadState>({loadState: 'loading'})

  window[authFailureCallbackName] = () => {
    delete window[authFailureCallbackName]
    subject.next({loadState: 'authError'})
  }

  window[callbackName] = () => {
    delete window[callbackName]
    subject.next({loadState: 'loaded', api: window.google.maps})
  }

  const script = document.createElement('script')
  script.onerror = (
    event: Event | string,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error
  ) =>
    subject.next({
      loadState: 'loadError',
      error: coeerceError(event, error),
    } as LoadErrorState)

  script.src = `https://maps.googleapis.com/maps/api/js?key=${config.apiKey}&libraries=places&callback=${callbackName}&language=${selectedLocale}`
  document.getElementsByTagName('head')[0].appendChild(script)

  return subject
}

function coeerceError(event: Event | string, error?: Error): Error {
  if (error) {
    return error
  }

  if (typeof event === 'string') {
    return new Error(event)
  }

  return new Error(isErrorEvent(event) ? event.message : 'Failed to load Google Maps API')
}

function isErrorEvent(event: unknown): event is ErrorEvent {
  if (typeof event !== 'object' || event === null) {
    return false
  }

  if (!('message' in event)) {
    return false
  }

  return typeof (event as ErrorEvent).message === 'string'
}
