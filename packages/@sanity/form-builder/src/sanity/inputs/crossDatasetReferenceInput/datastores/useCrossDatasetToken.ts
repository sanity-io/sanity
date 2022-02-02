import {SanityClient} from '@sanity/client'
import {useMemoObservable} from 'react-rx'
import {map, startWith} from 'rxjs/operators'

const TOKEN_BASE = `secrets.sanity.sharedContent`

type LoadState<T> =
  | {status: 'loading'}
  | {
      status: 'loaded'
      result: T | undefined
    }
  | {status: 'error'; error: Error}

type TokenDocument = {_id: string; _type: string; _updatedAt: string; token: string | undefined}
type TokenDocumentLoadState = LoadState<TokenDocument>

function fetchTokenDocument(client: SanityClient, id: string) {
  return client.observable.fetch(`*[_id == $id]{_id, _type, _updatedAt, token}[0]`, {
    id,
  })
}

function getTokenDocumentId({tokenId, projectId}: {tokenId?: string; projectId: string}) {
  return [TOKEN_BASE, projectId, tokenId].filter(Boolean).join('.')
}

export function useCrossDatasetToken(
  client: SanityClient,
  {projectId, tokenId}: {tokenId: string; dataset?: string; projectId: string}
): TokenDocumentLoadState {
  const tokenDocumentId = getTokenDocumentId({projectId, tokenId})
  return useMemoObservable(
    () =>
      fetchTokenDocument(client, tokenDocumentId).pipe(
        map(
          (document: TokenDocument | undefined) => ({status: 'loaded', result: document} as const)
        ),
        startWith({status: 'loading'} as const)
      ),
    [client, tokenDocumentId]
  )
}
