import {type SanityClient} from '@sanity/client'
import DataLoader from 'dataloader'
import {catchError, from, map, of} from 'rxjs'

import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'
import {type KeyValueStoreValue} from '../types'
import {type Backend} from './types'

/** @internal */
export interface ServerBackendOptions {
  client: SanityClient
}

interface KeyValuePair {
  key: string
  value: KeyValueStoreValue
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
      .request<(KeyValuePair | null)[]>({
        uri: `/users/me/keyvalue/${keys.join(',')}`,
        withCredentials: true,
      })
      .catch((error) => {
        // const value = await fetch(`http://localhost:5000/vX/users/me/keyvalue/${keys.join(',')}`)
        // .catch((error) => {
        if (error.response?.statusCode === 404) {
          return Array(keys.length).fill(null)
        }
        throw error
      })
    const response = Array.isArray(value) ? value : [value]
    const keyValuePairs = response.reduce(
      (acc, next) => {
        if (next?.key) {
          acc[next.key] = next.value
        }
        return acc
      },
      {} as Record<string, KeyValueStoreValue | null>,
    )
    return keys.map((key) => keyValuePairs[key] || null)
  })

  return {
    get: (key: string, defaultValue: unknown) => {
      return from(keyValueLoader.load(key)).pipe(
        map((value) => value ?? defaultValue),
        catchError((error) => {
          if (error.statusCode !== 404) {
            console.error('Error fetching data:', error)
          }

          return of(defaultValue) // Return the default value in case of error
        }),
      )
    },
    set: (key: string, nextValue: unknown) => {
      return from(
        client.request({
          method: 'PUT',
          uri: `/users/me/keyvalue`,
          body: [{key, value: nextValue}],
          withCredentials: true,
        }),
      ).pipe(
        map((response) => {
          keyValueLoader.clear(key) // Clear the cache for this key
          keyValueLoader.prime(key, response.value) // Prime the cache with the new value
          return response.value
        }),
        catchError((error) => {
          console.error('Error setting data:', error)
          return of(null) // Handle error (possibly return null or throw an error)
        }),
      )
    },
  }
}
