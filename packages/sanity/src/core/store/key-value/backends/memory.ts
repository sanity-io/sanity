import {type Observable, of as observableOf} from 'rxjs'

import {type Backend, type KeyValuePair} from './types'

const DB = Object.create(null)

const getKey = (key: string, defaultValue: unknown): Observable<unknown> =>
  observableOf(key in DB ? DB[key] : defaultValue)

const setKey = (key: string, nextValue: unknown): Observable<unknown> => {
  DB[key] = nextValue
  return observableOf(nextValue)
}

const getKeys = (keys: string[], defaultValues: unknown[]): Observable<unknown[]> => {
  return observableOf(keys.map((key, i) => (key in DB ? DB[key] : defaultValues[i])))
}

const setKeys = (keyValuePairs: KeyValuePair[]): Observable<unknown[]> => {
  keyValuePairs.forEach((pair) => {
    DB[pair.key] = pair.value
  })

  return observableOf(keyValuePairs.map((pair) => pair.value))
}

export const memoryBackend: Backend = {getKey, setKey, getKeys, setKeys}
