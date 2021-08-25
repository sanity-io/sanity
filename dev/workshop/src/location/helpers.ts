import qs from 'qs'
import type {LocationState} from './types'

export function getStateFromWindow(): LocationState {
  const query = qs.parse(window.location.search.substr(1))

  return {
    path: window.location.pathname,
    query,
    title: window.document.title,
  }
}

export function getNewState(state: LocationState, params: LocationState): LocationState {
  return {
    path: params.path || '/',
    title: params.title || state.title,
    query: params.query || {},
  }
}

export function getUrlFromState(state: LocationState): string {
  const searchString = qs.stringify(state.query)

  if (searchString) {
    return `${state.path}?${searchString}`
  }

  return state.path
}
