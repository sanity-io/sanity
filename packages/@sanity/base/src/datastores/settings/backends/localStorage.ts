import {Observable, of as observableOf} from 'rxjs'
import {Backend} from './types'

const tryParse = (val: string, defValue: unknown) => {
  try {
    return JSON.parse(val)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`Failed to parse settings: ${err.message}`)
    return defValue
  }
}

const get = (key: string, defValue: unknown): Observable<unknown> => {
  const val = localStorage.getItem(key)

  return observableOf(val === null ? defValue : tryParse(val, defValue))
}

const set = (key: string, nextValue: unknown): Observable<unknown> => {
  // Can't stringify undefined, and nulls are what
  // `getItem` returns when key does not exist
  if (typeof nextValue === 'undefined' || nextValue === null) {
    localStorage.removeItem(key)
  } else {
    localStorage.setItem(key, JSON.stringify(nextValue))
  }

  return observableOf(nextValue)
}

export const localStorageBackend: Backend = {get, set}
