import {type SanityClient} from '@sanity/client'

import {withLocalStorageSWR} from './localStorageSWR'
import {createServerKeyValueStore} from './serverKeyValueStore'

/** @internal */
export function createKeyValueStore(options: {client: SanityClient}) {
  return withLocalStorageSWR(createServerKeyValueStore(options))
}
