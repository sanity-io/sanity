import qs from 'qs'
import type {LocationState} from './types'

export function getStateFromWindow(): LocationState {
  const query = qs.parse(location.search.substr(1))

  return {
    path: location.pathname,
    query,
    title: document.title,
  }
}

export function getStateFromAnchor(a: HTMLAnchorElement): LocationState {
  const query = qs.parse(a.search.substr(1))

  return {
    path: a.pathname,
    query,
    title: a.getAttribute('data-page-title') || document.title,
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
