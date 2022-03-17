import {useDatastores} from '@sanity/base'
import {SanityClient} from '@sanity/client'
import {useMemoObservable} from 'react-rx'
import {map, startWith} from 'rxjs/operators'

type LoadState<T> =
  | {status: 'loading'}
  | {
      status: 'loaded'
      result: T | undefined
    }
  | {status: 'error'; error: Error}

export function useCrossProjectToken(
  client: SanityClient,
  {projectId, tokenId}: {tokenId?: string; projectId: string}
): LoadState<string> {
  const {crossProjectTokenStore, documentPreviewStore} = useDatastores()

  return useMemoObservable(
    () =>
      documentPreviewStore
        .observePaths(crossProjectTokenStore.getTokenDocumentId({projectId, tokenId}), ['token'])
        .pipe(
          map(
            (document: {token?: string} | undefined) =>
              ({status: 'loaded', result: document?.token} as const)
          ),
          startWith({status: 'loading'} as const)
        ),
    [client, crossProjectTokenStore, documentPreviewStore, projectId, tokenId]
  )
}
