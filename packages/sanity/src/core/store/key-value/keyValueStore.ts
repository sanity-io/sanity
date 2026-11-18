import {type SanityClient} from '@sanity/client'

import {withLocalStorageSWR} from './localStorageSWR'
import {createServerKeyValueStore} from './serverKeyValueStore'

/**
 * @internal
 * @deprecated The Studio keeps its preferences through the App SDK now: use
 * `useStudioPreference` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`
 * instead. `createKeyValueStore` will be removed in Sanity Studio v7.
 */
export function createKeyValueStore(options: {client: SanityClient}) {
  return withLocalStorageSWR(createServerKeyValueStore(options))
}
