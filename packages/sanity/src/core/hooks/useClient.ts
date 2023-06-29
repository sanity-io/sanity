import type {SanityClient} from '@sanity/client'
import type {SourceClientOptions} from '../config'
import {useSource} from '../studio'

/**
 * React hook that returns a configured Sanity client instance based on the given configuration.
 * Automatically uses the correct project and dataset based on the current active workspace.
 *
 * @public
 * @param clientOptions - Options for the client. Specifying
 *   {@link https://www.sanity.io/docs/api-versioning | apiVersion} is required in order to
 *   prevent breaking changes if studio changes the API version used in other places.
 *   See {@link SourceClientOptions}
 * @returns A configured Sanity client instance
 * @remarks The client instance is automatically memoized based on API version
 * @example Instantiating a client
 * ```ts
 * function MyComponent() {
 *   const client = useClient({apiVersion: '2021-06-07'})
 *   // ... do something with client instance ...
 * }
 * ```
 */
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
