import {Observable, of} from 'rxjs'

export interface MockClientTransactionLog {
  id: number
  commit: any[][]
  create: any[][]
  createIfNotExists: any[][]
  createOrReplace: any[][]
  delete: any[][]
  patch: any[][]
}

export interface MockClientLog {
  listen: {query: string; params?: any}[]
  observable: {
    fetch: {query: string; params?: any}[]
    getDocuments: {ids: string[]}[]
    listen: {query: string; params?: any}[]
    request: any[]
  }
  request: any[]
  transaction: MockClientTransactionLog[]
}

export function createMockSanityClient(
  data: {requests?: Record<string, any>} = {},
  options: {apiVersion?: string} = {},
) {
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
      id: 'grrm',
      name: 'George R.R. Martin',
      email: 'george@sanity.io',
      profileImage: 'https://i.hurimg.com/i/hdn/75/0x0/59c94dee45d2a027e83d45f2.jpg',
      role: 'administrator',
      roles: [
        {
          name: 'administrator',
          title: 'Administrator',
          description:
            'Read and write access to all datasets, with full access to all project settings.',
        },
      ],
      provider: 'google',
    },

    ...data.requests,
  }

  const apiVersion = (options.apiVersion || '1').replace(/^v/, '')
  const mockConfig = {
    useCdn: false,
    projectId: 'mock-project-id',
    dataset: 'mock-data-set',
    apiVersion,
    url: `https://mock-project-id.api.sanity.io/v${apiVersion}`,
    ...options,
  }

  const BASE_URL = `mock://${mockConfig.projectId}.sanity.api`

  const requestUriPrefix = `/projects/${mockConfig.projectId}/datasets/${mockConfig.dataset}`

  // const $log = jest.fn()
  const $log: MockClientLog = {
    listen: [],
    observable: {
      fetch: [],
      getDocuments: [],
      listen: [],
      request: [],
    },
    request: [],
    transaction: [],
  }

  const mockClient = {
    $log,

    config: () => mockConfig,

    getUrl: (uri: string) => {
      return BASE_URL + uri
    },

    withConfig: () => mockClient,

    request: (opts: {uri: string; tag?: string; withCredentials: boolean}) => {
      $log.request.push(opts)

      if (opts.uri.startsWith(requestUriPrefix)) {
        const path = opts.uri.slice(requestUriPrefix.length)

        if (requests[path]) {
          return Promise.resolve(requests[path])
        }
      }

      return Promise.resolve(requests[opts.uri] || requests['*'] || null)
    },

    listen: (query: string, params?: any) => {
      $log.listen.push({query, params})

      return of({type: 'welcome'})
    },

    observable: {
      fetch: (query: string, params?: any): Observable<any> => {
        $log.observable.fetch.push({query, params})
        // $log('observable.fetch', {query, params})

        return of(null)
      },

      getDocuments: (ids: string[]) => {
        $log.observable.getDocuments.push({ids})
        // $log('observable.getDocuments', {ids})
        return of([])
      },

      listen: (query: string, params?: any) => {
        $log.observable.listen.push({query, params})
        // $log('observable.listen', {query, params})
        return of({type: 'welcome'})
      },

      request: (opts: {uri: string; tag?: string; withCredentials: boolean}) => {
        // console.log('mockSanityClient.observable.request', opts)

        $log.observable.request.push(opts)

        if (opts.uri?.startsWith(requestUriPrefix)) {
          const path = opts.uri.slice(requestUriPrefix.length)

          if (requests[path]) {
            return of(requests[path])
          }
        }

        return of(requests[opts.uri] || requests['*'] || null)
      },

      transaction: () => {
        // $log.transaction.push(null)
        // $log('transaction')

        return _createTransaction({observable: true})
      },
    },

    transaction: () => {
      // $log.transaction.push(null)
      // $log('transaction')

      return _createTransaction({observable: false})
    },
  }

  //
  let transactionId = 0

  return mockClient

  function _createTransaction({observable}: {observable: boolean}) {
    const id = ++transactionId

    const $txLog: MockClientTransactionLog = {
      id,
      commit: [],
      create: [],
      createIfNotExists: [],
      createOrReplace: [],
      delete: [],
      patch: [],
    }

    $log.transaction.push($txLog)

    const tx = {
      commit: (...args: any[]) => {
        // $log(`transaction#${id}.commit`, ...args)
        $txLog.commit.push(args)
        return observable ? of({}) : Promise.resolve({})
      },
      create: (...args: any[]) => {
        $txLog.create.push(args)
        // $log(`transaction#${id}.create`, ...args)
        return tx
      },
      createIfNotExists: (...args: any[]) => {
        $txLog.createIfNotExists.push(args)
        // $log(`transaction#${id}.createIfNotExists`, ...args)
        return tx
      },
      createOrReplace: (...args: any[]) => {
        $txLog.createOrReplace.push(args)
        // $log(`transaction#${id}.createOrReplace`, ...args)
        return tx
      },
      delete: (...args: any[]) => {
        $txLog.delete.push(args)
        // $log(`transaction#${id}.delete`, ...args)
        return tx
      },
      patch: (...args: any[]) => {
        $txLog.patch.push(args)
        // $log(`transaction#${id}.patch`, ...args)
        return tx
      },
    }

    return tx
  }
}
