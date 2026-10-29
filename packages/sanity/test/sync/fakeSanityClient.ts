import {type Action, type SanityClient} from '@sanity/client'
import {defer, from, type Observable} from 'rxjs'

import {type MutationPayload} from '../../src/core/store/document/buffered-doc/types'
import {type FakeContentLake, type RawListenerEvent} from './fakeContentLake'

export interface FakeClientOptions {
  lake: FakeContentLake
  clientId: string
  projectId?: string
  dataset?: string
  apiVersion?: string
}

export function createFakeSanityClient(options: FakeClientOptions): SanityClient {
  const {lake, clientId, projectId = 'fake', dataset = 'sync', apiVersion = '2025-02-19'} = options
  // The token is per client because the store's memo caches key on credentials.
  const config = {
    projectId,
    dataset,
    token: `token-${clientId}`,
    apiVersion,
    apiHost: 'fake://content-lake',
  }

  const client = {
    config: () => config,
    withConfig: (next: Partial<typeof config>) =>
      createFakeSanityClient({...options, apiVersion: next?.apiVersion ?? apiVersion}),
    getUrl: (uri: string) => `fake://content-lake${uri}`,
    getDataUrl: (operation: string) => `/data/${operation}/${dataset}`,
    dataRequest: (
      endpoint: string,
      body: {mutations: MutationPayload[]; transactionId?: string},
    ) => {
      if (endpoint === 'mutate') {
        return lake.submitMutations(
          clientId,
          body.mutations,
          body.transactionId ?? `live-${Date.now()}`,
        )
      }
      return Promise.reject(new Error(`Unsupported dataRequest ${endpoint}`))
    },
    observable: {
      listen: (_query: string, params: {ids: string[]}): Observable<RawListenerEvent> =>
        lake.listen(clientId, params.ids),
      getDocuments: (ids: string[]) => defer(() => from(Promise.resolve(lake.getDocuments(ids)))),
      action: (actions: Action | Action[], actionOptions?: {transactionId?: string}) =>
        defer(() =>
          from(
            lake.submitActions(
              clientId,
              Array.isArray(actions) ? actions : [actions],
              actionOptions?.transactionId ?? `action-${Date.now()}`,
            ),
          ),
        ),
    },
  }
  return client as unknown as SanityClient
}
