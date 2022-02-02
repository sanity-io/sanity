import {SanityClient} from '@sanity/client'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {defer, merge, Observable, of, Subject} from 'rxjs'
import {delay, map, shareReplay, switchMap, switchMapTo} from 'rxjs/operators'
import {memoize} from 'lodash'

const TOKEN_BASE = `secrets.sanity.sharedContent`

type TokenDocument = {_id: string; _type: string; _updatedAt: string; token: string | undefined}
type State =
  | {status: 'loading'}
  | {
      status: 'loaded'
      result: TokenDocument | undefined
    }
  | {status: 'error'; error: Error}

function createDatastore(
  client: SanityClient,
  tokenDocumentId: string
): [Observable<State>, (token: string) => void] {
  const submitNewToken$ = new Subject()

  const mutations$ = submitNewToken$.pipe(
    switchMap((tokenValue) => {
      let tr = client.observable.transaction()
      tr = tokenValue
        ? tr
            .createIfNotExists({_id: tokenDocumentId, _type: 'crossDatasetToken'})
            .patch(tokenDocumentId, (p) => p.set({token: tokenValue}))
        : tr.delete(tokenDocumentId)
      return tr.commit()
    })
  )

  const fetch$ = fetchTokenDocument(client, tokenDocumentId).pipe(
    map((document: TokenDocument | undefined) => ({status: 'loaded', result: document} as const))
  )

  const state$ = merge(
    of({status: 'loading'} as const),
    fetch$,
    mutations$.pipe(delay(1200), switchMapTo(fetch$))
  ).pipe(shareReplay({refCount: true, bufferSize: 1}))

  return [state$, (nextToken: string) => submitNewToken$.next(nextToken)]
}

const createMemoizedStore = memoize(createDatastore, (client, tokenDocumentId) => tokenDocumentId)

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
): [State, (nextToken) => void] {
  const [token$, saveToken] = useMemo(() => {
    return createMemoizedStore(client, getTokenUrl({dataset, projectId, tokenId}))
  }, [client, dataset, projectId, tokenId])

  const state = useObservable(token$, {status: 'loading'} as const)

  return [state, saveToken]
}
