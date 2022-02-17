import {SanityClient} from '@sanity/client'
import {useMemoObservable} from 'react-rx'
import {concat, defer, of} from 'rxjs'
import {map} from 'rxjs/operators'

const TOKEN_BASE = `secrets.sanity.sharedContent`

type TokenDocument = {_id: string; _type: string; _updatedAt: string; token: string | undefined}
type State =
  | {status: 'loading'}
  | {
      status: 'loaded'
      result: TokenDocument | undefined
    }
  | {status: 'error'; error: Error}

function fetchTokenDocument(client: SanityClient, id: string) {
  return defer(() =>
    client.observable.fetch(`*[_id == $id]{_id, _type, _updatedAt, token}[0]`, {
      id: id,
    })
  )
}

function getTokenUrl({
  tokenId,
  dataset,
  projectId,
}: {
  tokenId: string
  dataset: string
  projectId: string
}) {
  return [TOKEN_BASE, projectId, dataset, tokenId].join('.')
}

export function useCrossDatasetToken(
  client: SanityClient,
  {dataset, projectId, tokenId}: {tokenId: string; dataset: string; projectId: string}
): State {
  const tokenUrl = getTokenUrl({dataset, projectId, tokenId})
  return useMemoObservable(
    () =>
      concat(
        of({status: 'loading'} as const),
        fetchTokenDocument(client, tokenUrl).pipe(
          map(
            (document: TokenDocument | undefined) => ({status: 'loaded', result: document} as const)
          )
        )
      ),
    [client, tokenUrl]
  )
}
