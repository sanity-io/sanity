import {withLocalStorageSWR} from './localStorageSWR'
import {createServerKeyValueStore} from './serverKeyValueStore'
import {type SanityClient} from '@sanity/client'

/** @internal */
export function createKeyValueStore(options: {client: SanityClient}) {
  return withLocalStorageSWR(createServerKeyValueStore(options))
}
