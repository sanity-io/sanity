/* eslint-disable no-console */

export default createClient

function createClient(clientOpts: any) {
  console.log('[mock] sanityClient.create', clientOpts)
  return {
    clone: (opts: any = {}) => createClient({...clientOpts, ...opts}),
    config: (opts: any = {}) => createClient({...clientOpts, ...opts}),
    getUrl: (uri: string) => {
      console.log('[mock] sanityClient.getUrl', uri)
      return uri
    },
    request: (opts: any) => {
      console.log('[mock] sanityClient.request', opts)

      if (opts.uri === '/users/me') {
        return Promise.resolve({
          id: 'foo',
          name: 'Doug Engelbart',
          email: 'doug@sanity.io',
          profileImage: 'https://source.unsplash.com/96x96/?face',
          role: 'administrator',
          roles: [
            {
              name: 'administrator',
              title: 'Administrator',
              description:
                'Read and write access to all datasets, with full access to all project settings.',
            },
          ],
        })
      }

      return Promise.resolve({})
    },
  }
}
