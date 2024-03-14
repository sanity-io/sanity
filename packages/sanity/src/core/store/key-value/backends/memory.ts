import {type Observable, of as observableOf} from 'rxjs'

import {type Backend, type KeyValuePair} from './types'

const DB = Object.create(null)

const getKey = (key: string): Observable<unknown> => observableOf(key in DB ? DB[key] : null)

const setKey = (key: string, nextValue: unknown): Observable<unknown> => {
  DB[key] = nextValue
  return observableOf(nextValue)
}

const getKeys = (keys: string[]): Observable<unknown[]> => {
  return observableOf(keys.map((key, i) => (key in DB ? DB[key] : null)))
}

const setKeys = (keyValuePairs: KeyValuePair[]): Observable<unknown[]> => {
  keyValuePairs.forEach((pair) => {
    DB[pair.key] = pair.value
  })

  return observableOf(keyValuePairs.map((pair) => pair.value))
}

export const memoryBackend: Backend = {getKey, setKey, getKeys, setKeys}
