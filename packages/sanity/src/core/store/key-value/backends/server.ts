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
    const keyValuePairs = await client
      .request<KeyValuePair[]>({
        uri: `/users/me/keyvalue/${keys.join(',')}`,
        withCredentials: true,
      })
      .catch((error) => {
        console.error('Error fetching data:', error)
        return Array(keys.length).fill(null)
      })

    return keyValuePairs.map((pair) => pair.value)
  })

  const getKeys = (keys: string[]) => {
    return from(keyValueLoader.loadMany(keys))
  }

  const setKeys = (keyValuePairs: KeyValuePair[]) => {
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
        return response.map((pair) => pair.value)
      }),
      catchError((error) => {
        console.error('Error setting data:', error)
        return of(Array(keyValuePairs.length).fill(null))
      }),
    )
  }

  return {
    getKey: (key: string) => {
      return getKeys([key]).pipe(map((values) => values[0]))
    },
    setKey: (key: string, nextValue: unknown) => {
      return setKeys([{key, value: nextValue as KeyValueStoreValue}]).pipe(
        map((values) => values[0]),
      )
    },
    getKeys,
    setKeys,
  }
}
