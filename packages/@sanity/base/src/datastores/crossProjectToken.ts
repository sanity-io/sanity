import {from, Observable, of} from 'rxjs'
import {filter, map, mergeMap, toArray} from 'rxjs/operators'
import {SanityClient} from '@sanity/client'
import {versionedClient} from '../client/versionedClient'

const TOKEN_DOCUMENT_ID_BASE = `secrets.sanity.sharedContent`

function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null
}

function fetchTokenDocument(client: SanityClient, id: string) {
  return client.observable.fetch(`*[_id == $id]{_id, _type, _updatedAt, token}[0]`, {
    id,
  })
}

export function getTokenDocumentId({tokenId, projectId}: {tokenId?: string; projectId: string}) {
  return [TOKEN_DOCUMENT_ID_BASE, projectId, tokenId].filter(Boolean).join('.')
}

export function getProjectIdFromTokenDocumentId(id: string): null | string {
  if (!id.startsWith(TOKEN_DOCUMENT_ID_BASE)) {
    return null
  }
  //prettier-ignore
  const [/*secrets*/, /*sanity*/, /*sharedContent*/, projectId] = id.split('.')
  return projectId
}

export function fetchCrossProjectToken(
  client,
  {projectId, tokenId}: {projectId: string; tokenId?: string}
): Observable<string | undefined> {
  if (client.config().projectId === projectId) {
    return of(undefined)
  }
  return fetchTokenDocument(client, getTokenDocumentId({projectId, tokenId})).pipe(
    map((tokenDoc) => tokenDoc.token)
  )
}

export function fetchAllCrossProjectTokens(): Observable<
  {
    projectId: string
    token: string
  }[]
> {
  return versionedClient.observable
    .fetch(`*[_id in path("${TOKEN_DOCUMENT_ID_BASE}.**")]{_id, _type, _updatedAt, token}`)
    .pipe(
      mergeMap((tokenDocs: {_id: string; token: string}[]) => from(tokenDocs)),
      map((doc) => {
        const projectId = getProjectIdFromTokenDocumentId(doc._id)
        return projectId ? {projectId, token: doc.token} : null
      }),
      filter(isNonNullable),
      toArray()
    )
}
