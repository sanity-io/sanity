import getDefaultModule from './getDefaultModule'

interface SanityClient {
  fetch(query: string, params: {[key: string]: any}): Promise<any>
}

// We are lazy-loading the part to work around typescript trying to resolve it
const client = ((): SanityClient => {
  const client: SanityClient = getDefaultModule(require('part:@sanity/base/client'))
  return client
})()

export {client}
