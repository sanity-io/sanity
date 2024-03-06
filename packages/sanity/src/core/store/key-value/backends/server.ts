import {type SanityClient} from '@sanity/client'
import DataLoader from 'dataloader'
import {catchError, from, map, of} from 'rxjs'

import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'
import {type KeyValueStoreValue} from '../types'
import {type Backend, type KeyValuePair} from './types'

/** @internal */
export interface ServerBackendOptions {
  client: SanityClient
}

/**
 * One of serveral possible backends for KeyValueStore. This backend uses the
 * Sanity client to store and retrieve key-value pairs from the /users/me/keyvalue endpoint.
 * @internal
 */
export function serverBackend({client: _client}: ServerBackendOptions): Backend {
  const client = _client.withConfig({...DEFAULT_STUDIO_CLIENT_OPTIONS, apiVersion: 'vX'})

  const keyValueLoader = new DataLoader<string, KeyValueStoreValue | null>(async (keys) => {
    const value = await client
      .request<KeyValuePair[]>({
        uri: `/users/me/keyvalue/${keys.join(',')}`,
        withCredentials: true,
      })
      .catch((error) => {
        if (error.response?.statusCode === 404) {
          return Array(keys.length).fill(null)
        }
        throw error
      })
    const keyValuePairs = value.reduce(
      (acc, next) => {
        if (next?.key) {
          acc[next.key] = next.value
        }
        return acc
      },
      {} as Record<string, KeyValueStoreValue | null>,
    )

    const result = keys.map((key) => keyValuePairs[key] || null)
    return result
  })

  return {
    getKey: (key: string, defaultValue: unknown) => {
      return from(keyValueLoader.load(key)).pipe(
        map((value) => {
          return value ?? defaultValue
        }),
        catchError((error) => {
          console.error('Error fetching data:', error)
          return of(defaultValue)
        }),
      )
    },
    setKey: (key: string, nextValue: unknown) => {
      return from(
        client.request<KeyValuePair[]>({
          method: 'PUT',
          uri: `/users/me/keyvalue`,
          body: [{key, value: nextValue}],
          withCredentials: true,
        }),
      ).pipe(
        map((response) => {
          const newValue = response[0].value
          if (newValue) {
            keyValueLoader.clear(key)
            keyValueLoader.prime(key, newValue)
          }
          return newValue
        }),
        catchError((error) => {
          console.error('Error setting data:', error)
          return of(null)
        }),
      )
    },
    getKeys: (keys: string[], defValues: unknown[]) => {
      return from(keyValueLoader.loadMany(keys)).pipe(
        map((values) => {
          return values.map((value, i) => value ?? defValues[i])
        }),
        catchError((error) => {
          console.error('Error fetching data:', error)
          return of(defValues)
        }),
      )
    },
    setKeys: (keyValuePairs: KeyValuePair[]) => {
      return from(
        client.request<KeyValuePair[]>({
          method: 'PUT',
          uri: `/users/me/keyvalue`,
          body: keyValuePairs,
          withCredentials: true,
        }),
      ).pipe(
        map((response) => {
          response.forEach((pair) => {
            keyValueLoader.clear(pair.key)
            keyValueLoader.prime(pair.key, pair.value)
          })
          return response.map((pair: KeyValuePair) => pair.value)
        }),
        catchError((error) => {
          console.error('Error setting data:', error)
          return of(Array(keyValuePairs.length).fill(null))
        }),
      )
    },
  }
}
