import type {SanityClient} from '@sanity/client'
import type {SourceClientOptions} from '../config'
import {useSource} from '../studio'

/**
 * @public
 */
export function useClient(clientOptions: SourceClientOptions): SanityClient {
  return useSource().getClient(clientOptions)
}
