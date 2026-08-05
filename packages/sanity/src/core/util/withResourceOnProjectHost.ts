import {type ClientConfig, type SanityClient} from '@sanity/client'

/**
 * A global resource a client can be scoped to. `@sanity/client` does not
 * export this union, so derive it from the config it belongs to.
 *
 * @internal
 */
export type ClientConfigResource = NonNullable<ClientConfig['resource']>

/**
 * Scope `client` to a global resource (Media Library, Canvas, another
 * project's dataset) while keeping the request on the project's API host.
 *
 * `@sanity/client` drops the project subdomain as soon as `resource` is set,
 * so a plain `withConfig({resource})` targets the global host — and the global
 * host rejects browser requests with `403 CORS Origin not allowed` and no
 * `access-control-allow-*` headers, because CORS allowlists only exist per
 * project. The project host serves the same resource routes *and* honours the
 * allowlist, so pin the request there.
 *
 * @internal
 */
export function withResourceOnProjectHost(
  client: SanityClient,
  config: {resource: ClientConfigResource; apiVersion?: string},
): SanityClient {
  const {apiHost, projectId} = client.config()

  if (!projectId) {
    throw new Error('Cannot create a resource-scoped client: missing projectId in client config')
  }

  const host = new URL(apiHost)
  host.hostname = `${projectId}.${host.hostname}`

  return client.withConfig({...config, apiHost: host.origin})
}
