import type {SanityClient} from '@sanity/client'

/**
 * Get an absolute API URL based on a configured client
 *
 * @param client - The client to use
 * @param uri - The URI path to generate an URL for
 * @param useCdn - Whether or not to use the API CDN when generating the URL
 * @returns The absolute URL
 * @internal
 */
export function getApiUrl(client: SanityClient, uri: string, useCdn = false): string {
  const config = client.config()
  const base = useCdn ? config.cdnUrl : config.url
  return `${base}/${uri.replace(/^\//, '')}`
}

/**
 * Get relative URL for a data API endpoint based on a configured client
 *
 * @param client - The client to use
 * @param operation - The operation to perform, eg `query`, `mutate`, `listen` etc
 * @param path - Any additional path to add to the URL
 * @returns The relative URL. Pass to `getApiUrl()` for an absolute one.
 * @internal
 */
export function getDataApiUrl(client: SanityClient, operation: string, path?: string): string {
  const {dataset} = client.config()
  const baseUri = `/${operation}/${dataset}`
  const uri = path ? `${baseUri}/${path}` : baseUri
  return `/data${uri}`.replace(/\/($|\?)/, '$1')
}
