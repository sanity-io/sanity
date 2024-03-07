import {SanityEncoder} from '@bjoerge/mutiny'
import {type ContentLakeStore, createContentLakeStore} from '@bjoerge/mutiny/_unstable_store'
import {type SanityClient} from '@sanity/client'
import {from} from 'rxjs'
import {concatMap} from 'rxjs/operators'

import {createDatasetListener} from '../store/buffered-dataset/createDatasetListener'

const cache = new Map<string, ContentLakeStore>()

export function useBufferedDataset(client: SanityClient) {
  const {projectId, dataset} = client.config()
  const key = `${projectId}/${dataset}`
  if (!cache.has(key)) {
    cache.set(
      key,
      createContentLakeStore({
        observe: createDatasetListener(client),
        submit: (transactions) => {
          return from(transactions).pipe(
            concatMap((transact) =>
              client.dataRequest('mutate', SanityEncoder.encodeTransaction(transact), {
                visibility: 'async',
                returnDocuments: false,
              }),
            ),
          )
        },
      }),
    )
  }

  return cache.get(key)!
}
