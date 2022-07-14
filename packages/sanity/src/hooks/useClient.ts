import type {SanityClient} from '@sanity/client'
import {useSource} from '../studio'

/**
 * @public
 */
export function useClient(): SanityClient {
  return useSource().client
}
