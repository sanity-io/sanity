import {type RequestHandler, type SanityClient} from '@sanity/client'

// A custom `AuthStore` (or `unstable_clientFactory`) may emit a client that
// does not implement `withConfig`; such a client can neither be given nor
// stripped of a request handler after the fact, so it is returned as-is.

/** @internal */
export function withRequestHandler(client: SanityClient, requestHandler: RequestHandler) {
  return typeof client.withConfig === 'function' ? client.withConfig({requestHandler}) : client
}

/** @internal */
export function withoutRequestHandler(client: SanityClient): SanityClient {
  return typeof client.withConfig === 'function'
    ? client.withConfig({requestHandler: undefined})
    : client
}
