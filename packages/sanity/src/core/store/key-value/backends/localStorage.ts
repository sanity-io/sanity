import {type Observable, of as observableOf} from 'rxjs'

import {type Backend, type KeyValuePair} from './types'

const tryParse = (val: string) => {
  try {
    return JSON.parse(val)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`Failed to parse settings: ${err.message}`)
    return null
  }
}

const getKey = (key: string): Observable<unknown> => {
  const val = localStorage.getItem(key)

  return observableOf(val === null ? null : tryParse(val))
}

const setKey = (key: string, nextValue: unknown): Observable<unknown> => {
  // Can't stringify undefined, and nulls are what
  // `getItem` returns when key does not exist
  if (typeof nextValue === 'undefined' || nextValue === null) {
    localStorage.removeItem(key)
  } else {
    localStorage.setItem(key, JSON.stringify(nextValue))
  }

  return observableOf(nextValue)
}

const getKeys = (keys: string[]): Observable<unknown[]> => {
  const values = keys.map((key, i) => {
    const val = localStorage.getItem(key)
    return val === null ? null : tryParse(val)
  })

  return observableOf(values)
}

const setKeys = (keyValuePairs: KeyValuePair[]): Observable<unknown[]> => {
  keyValuePairs.forEach((pair) => {
    if (pair.value === undefined || pair.value === null) {
      localStorage.removeItem(pair.key)
    } else {
      localStorage.setItem(pair.key, JSON.stringify(pair.value))
    }
  })
  return observableOf(keyValuePairs.map((pair) => pair.value))
}

export const localStorageBackend: Backend = {getKey, setKey, getKeys, setKeys}
