import {Observable, of as observableOf} from 'rxjs'
import {Backend} from './types'

const DB = Object.create(null)

const get = (key: string, defValue: unknown): Observable<unknown> =>
  observableOf(key in DB ? DB[key] : defValue)

const set = (key: string, nextValue: unknown): Observable<unknown> => {
  if (typeof nextValue === 'undefined' || nextValue === null) {
    delete DB[key]
  } else {
    DB[key] = nextValue
  }

  return observableOf(nextValue)
}

export const memoryBackend: Backend = {get, set}
