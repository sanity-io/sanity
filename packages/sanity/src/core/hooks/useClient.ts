import type {SanityClient} from '@sanity/client'
import type {SourceClientOptions} from '../config'
import {useSource} from '../studio'

/** @beta */
export function useClient(clientOptions?: SourceClientOptions): SanityClient {
  const source = useSource()
  if (!clientOptions) {
    console.warn(
      'Calling `useClient()` without specifying an API version is deprecated and will stop working in the next dev-preview release - please migrate to use `useClient({apiVersion: "2021-06-07"})`.'
    )
    return source.getClient({apiVersion: '2021-06-07'})
  }

  return source.getClient(clientOptions)
}
