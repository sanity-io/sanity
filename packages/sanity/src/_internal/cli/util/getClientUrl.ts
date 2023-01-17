import type {SanityClient} from '@sanity/client'

export const getClientUrl = (client: SanityClient, uri: string, useCdn = false): string => {
  const config = client.config()
  const base = useCdn ? config.cdnUrl : config.url
  return `${base}/${uri.replace(/^\//, '')}`
}
