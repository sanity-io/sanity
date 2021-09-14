/* eslint-disable no-console */

export default createClient

function createClient(opts: unknown) {
  console.log('[mock] sanityClient', opts)
  return {
    clone: createClient,
    config: createClient,
    getUrl: (...args: unknown[]) => {
      console.log('[mock] sanityClient.getUrl', ...args)
      return ''
    },
    request: (...args: unknown[]) => {
      console.log('[mock] sanityClient.request', ...args)
      return Promise.resolve({})
    },
  }
}
