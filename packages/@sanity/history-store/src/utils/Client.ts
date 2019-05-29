import getDefaultModule from './getDefaultModule'

const clientConfig = {
  apiHost: 'https://api.sanity.work',
  useProjectHostname: true,
  useCdn: false
}

interface SanityClient {
  request(options: { [key: string]: any }): Promise<any>
  fetch(query: string, params: { [key: string]: any }): Promise<any>
  config(options: { [key: string]: any }): any
  clientConfig: any
}

// We are lazy-loading the part to work around typescript trying to resolve it
const client = ((): SanityClient => {
  const client: SanityClient = getDefaultModule(require('part:@sanity/base/client'))
  return client.config(clientConfig)
})()

export { client }
