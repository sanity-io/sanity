import {Observable, of} from 'rxjs'

export function createMockSanityClient(data: {requests?: Record<string, any>} = {}) {
  const requests: Record<string, any> = {
    '/auth/providers': {
      thirdPartyLogin: true,
      sso: {saml: true},
      providers: [
        {name: 'google', title: 'Google', url: 'https://api.sanity.io/v1/auth/login/google'},
        {name: 'github', title: 'GitHub', url: 'https://api.sanity.io/v1/auth/login/github'},
        {
          name: 'sanity',
          title: 'E-mail / password',
          url: 'https://api.sanity.io/v1/auth/login/sanity',
        },
      ],
    },

    '/users/me': {
      //
    },

    ...data.requests,
  }

  const mockConfig = {
    useCdn: false,
    projectId: 'mock-project-id',
    dataset: 'mock-data-set',
    apiVersion: '1',
  }

  const BASE_URL = `mock://${mockConfig.projectId}.sanity.api`

  const requestUriPrefix = `/projects/${mockConfig.projectId}/datasets/${mockConfig.dataset}`

  const $log = jest.fn()

  const mockClient = {
    $log: $log.mock,

    config: () => mockConfig,

    getUrl: (uri: string) => {
      return BASE_URL + uri
    },

    withConfig: () => mockClient,

    request: (opts: {uri: string; tag?: string; withCredentials: boolean}) => {
      $log('request', opts)

      if (opts.uri.startsWith(requestUriPrefix)) {
        const path = opts.uri.slice(requestUriPrefix.length)

        if (requests[path]) {
          return Promise.resolve(requests[path])
        }
      }

      return Promise.resolve(requests[opts.uri] || requests['*'] || null)
    },

    listen: (query: string, params?: any) => {
      $log('listen', {query, params})
      return of({type: 'welcome'})
    },

    observable: {
      fetch: (query: string, params?: any): Observable<any> => {
        $log('observable.fetch', {query, params})
        return of(null)
      },

      getDocuments: (ids: string[]) => {
        $log('observable.getDocuments', {ids})
        return of([])
      },

      listen: (query: string, params?: any) => {
        $log('observable.listen', {query, params})
        return of({type: 'welcome'})
      },

      request: (opts: {uri: string; tag?: string; withCredentials: boolean}) => {
        $log('observable.request', opts)

        if (opts.uri.startsWith(requestUriPrefix)) {
          const path = opts.uri.slice(requestUriPrefix.length)

          if (requests[path]) {
            return of(requests[path])
          }
        }

        return of(requests[opts.uri] || requests['*'] || null)
      },
    },

    transaction: () => {
      $log('transaction')

      return _createTransaction()
    },
  }

  // Use a counter to generate transaction IDs
  let transactionId = 0

  return mockClient

  function _createTransaction() {
    const id = ++transactionId

    const $tx = {
      commit: (...args: any[]) => {
        $log(`transaction#${id}.commit`, ...args)
        return Promise.resolve({})
      },
      create: (...args: any[]) => {
        $log(`transaction#${id}.create`, ...args)
        return $tx
      },
      createOrReplace: (...args: any[]) => {
        $log(`transaction#${id}.createOrReplace`, ...args)
        return $tx
      },
      delete: (...args: any[]) => {
        $log(`transaction#${id}.delete`, ...args)
        return $tx
      },
      patch: (...args: any[]) => {
        $log(`transaction#${id}.patch`, ...args)
        return $tx
      },
    }

    return $tx
  }
}
