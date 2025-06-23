import {type SanityClient} from '@sanity/client'

import {withLocalStorageSWR} from './localStorageSWR'
import {createServerKeyValueStore} from './serverKeyValueStore'
import {type KeyValueStore} from './types'

/** @internal */
export function createKeyValueStore(options: {client: SanityClient}): KeyValueStore {
  return withLocalStorageSWR(createServerKeyValueStore(options))
}
