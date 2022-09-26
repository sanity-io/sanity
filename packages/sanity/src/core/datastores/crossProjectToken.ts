import {from, Observable, of} from 'rxjs'
import {filter, map, mergeMap, toArray} from 'rxjs/operators'
import {SanityClient} from '@sanity/client'

export interface CrossProjectTokenStore {
  getTokenDocumentId: ({tokenId, projectId}: {tokenId?: string; projectId: string}) => string
  getProjectIdFromTokenDocumentId: (id: string) => null | string
  fetchCrossProjectToken: (
    client: SanityClient,
    {projectId, tokenId}: {projectId: string; tokenId?: string}
  ) => Observable<string | undefined>
  fetchAllCrossProjectTokens: () => Observable<
    {
      projectId: string
      token: string
    }[]
  >
}

const TOKEN_DOCUMENT_ID_BASE = `secrets.sanity.sharedContent`

function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null
}

export interface CrossProjectTokenStoreOptions {
  client: SanityClient
}

// eslint-disable-next-line camelcase
export function __tmp_wrap_crossProjectToken({
  client: _client,
}: CrossProjectTokenStoreOptions): CrossProjectTokenStore {
  const versionedClient = _client.withConfig({apiVersion: '1'})

  function fetchTokenDocument(client: SanityClient, id: string) {
    return client.observable.fetch(`*[_id == $id]{_id, _type, _updatedAt, token}[0]`, {
      id,
    })
  }

  return {
    getTokenDocumentId,
    getProjectIdFromTokenDocumentId,
    fetchCrossProjectToken,
    fetchAllCrossProjectTokens,
  }

  // export
  function getTokenDocumentId({tokenId, projectId}: {tokenId?: string; projectId: string}) {
    return [TOKEN_DOCUMENT_ID_BASE, projectId, tokenId].filter(Boolean).join('.')
  }

  // export
  function getProjectIdFromTokenDocumentId(id: string): null | string {
    if (!id.startsWith(TOKEN_DOCUMENT_ID_BASE)) {
      return null
    }
    //prettier-ignore
    const [/*secrets*/, /*sanity*/, /*sharedContent*/, projectId] = id.split('.')
    return projectId
  }

  // export
  function fetchCrossProjectToken(
    client: SanityClient,
    {projectId, tokenId}: {projectId: string; tokenId?: string}
  ): Observable<string | undefined> {
    if (client.config().projectId === projectId) {
      return of(undefined)
    }
    return fetchTokenDocument(client, getTokenDocumentId({projectId, tokenId})).pipe(
      map((tokenDoc) => tokenDoc.token)
    )
  }

  // export
  function fetchAllCrossProjectTokens(): Observable<
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
}
