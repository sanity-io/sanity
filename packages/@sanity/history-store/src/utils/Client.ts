import getDefaultModule from './getDefaultModule'

interface SanityClient {
  request(options: { [key: string]: any }): Promise<any>
  fetch(query: string, params: { [key: string]: any }): Promise<any>
  config(options: { [key: string]: any }): any
  clientConfig: any
}

const sanityEnv = window.location.hostname === 'localhost' ? 'staging' : (process.env.SANITY_ENV || 'production')

const apiHosts = {
  production: 'https://api.sanity.io',
  staging: 'https://api.sanity.work'
}

const getClientConfig = (): { [key: string]: any } => {
  return {
    apiHost: (apiHosts as any)[sanityEnv],
    useProjectHostname: true,
    useCdn: false
  }
}

// We are lazy-loading the part to work around typescript trying to resolve it
const client = ((): SanityClient => {
  const client: SanityClient = getDefaultModule(require('part:@sanity/base/client'))
  return client.config(getClientConfig())
})()

export { client }
