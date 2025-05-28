import {type SanityClient} from '@sanity/client'
import DataLoader from 'dataloader'

import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'
import {type KeyValueStoreValue} from '../types'
import {type KeyValuePair} from './types'

/** @internal */
export interface ServerStorageOptions {
  client: SanityClient
}

export interface ServerStorage {
  getKey: (key: string) => Promise<KeyValueStoreValue | null>
  setKey: (key: string, nextValue: unknown) => Promise<KeyValueStoreValue>
}

/**
 * Backend uses the Sanity client to store and retrieve key-value pairs from the /users/me/keyvalue endpoint.
 * @internal
 */
export function createServerStorage({client: _client}: ServerStorageOptions): ServerStorage {
  const client = _client.withConfig(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const keyValueLoader = new DataLoader<string, KeyValueStoreValue | null>(async (keys) => {
    const value = await client
      .request<KeyValuePair[]>({
        uri: `/users/me/keyvalue/${keys.join(',')}`,
      })
      .catch((error) => {
        console.error('Error fetching data:', error)
        return Array(keys.length).fill(null)
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

    return keys.map((key) => keyValuePairs[key] || null)
  })

  const getKey = (key: string) => {
    return keyValueLoader.load(key)
  }

  const setKey = (key: string, nextValue: unknown) => {
    return client
      .request<KeyValuePair[]>({
        method: 'PUT',
        uri: `/users/me/keyvalue`,
        body: [{key, value: nextValue}],
      })
      .then(
        (response) => {
          const pair = response[0]
          keyValueLoader.clear(pair.key)
          keyValueLoader.prime(pair.key, pair.value)
          return pair.value
        },
        (error) => {
          console.error('Error setting data:', error)
          return null
        },
      )
  }

  return {
    getKey,
    setKey,
  }
}
