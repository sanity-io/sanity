import {SanityClient} from '@sanity/client'
import {useMemoObservable} from 'react-rx'
import {map, startWith} from 'rxjs/operators'
import {useCrossProjectTokenStore, useDocumentPreviewStore} from '../../../../../datastores'
import {isRecord} from '../../../../../util'

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
): LoadState<string> | undefined {
  const documentPreviewStore = useDocumentPreviewStore()
  const crossProjectTokenStore = useCrossProjectTokenStore()

  return useMemoObservable(() => {
    return documentPreviewStore
      .observePaths(
        {
          _type: 'reference',
          _ref: crossProjectTokenStore.getTokenDocumentId({projectId, tokenId}),
        },
        ['token']
      )
      .pipe(
        map((documentValue) => {
          const value: Record<string, unknown> | undefined = isRecord(documentValue)
            ? documentValue
            : undefined

          return {
            status: 'loaded',
            result: typeof value?.token === 'string' ? value?.token : undefined,
          } as const
        }),
        startWith({status: 'loading'} as const)
      )
  }, [client, crossProjectTokenStore, documentPreviewStore, projectId, tokenId])
}
