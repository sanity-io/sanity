import {getTokenDocumentId, observePaths} from '@sanity/base/_internal'
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

export function useCrossDatasetToken(
  client: SanityClient,
  {projectId, tokenId}: {tokenId?: string; projectId: string}
): LoadState<string> {
  return useMemoObservable(
    () =>
      observePaths(getTokenDocumentId({projectId, tokenId}), ['token']).pipe(
        map(
          (document: {token?: string} | undefined) =>
            ({status: 'loaded', result: document?.token} as const)
        ),
        startWith({status: 'loading'} as const)
      ),
    [client, projectId, tokenId]
  )
}
