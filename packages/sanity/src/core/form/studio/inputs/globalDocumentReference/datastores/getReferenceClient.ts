import {
  type Any,
  type ClientReturn,
  connectEventSource,
  type QueryWithoutParams,
  type SanityClient,
  type SanityDocument,
  type ServerSentEvent,
} from '@sanity/client'
import {type GlobalDocumentReferenceSchemaType} from '@sanity/types'
import {map, type Observable} from 'rxjs'

export type ReferenceClient = {
  getDocument<R extends Record<string, Any>>(
    id: string,
    searchParams?: URLSearchParams,
  ): Observable<SanityDocument<R> | null>
  getDocuments<R extends Record<string, Any>>(
    ids: string[],
    searchParams?: URLSearchParams,
  ): Observable<{
    documents: SanityDocument<R>[]
    omitted: {id: string; reason: 'existence' | 'permission'}[]
  }>
  query<
    R = Any,
    Q extends Record<string, unknown> | undefined = QueryWithoutParams,
    G extends string = string,
  >(
    query: G,
    params?: Q | QueryWithoutParams,
  ): Observable<ClientReturn<G, R>>
  listen<
    Q extends Record<string, string> | undefined = QueryWithoutParams,
    G extends string = string,
  >(
    query: G,
    params?: Q | QueryWithoutParams,
    opts?: {includeResult?: boolean},
  ): Observable<ServerSentEvent<'mutation' | 'welcome'>>
}

export function getReferenceClient(
  client: SanityClient,
  schemaType: GlobalDocumentReferenceSchemaType,
): ReferenceClient {
  if (schemaType.resourceType === 'dataset') {
    const [projectId, datasetName] = schemaType.resourceId.split('.', 2)
    return {
      getDocument<R extends Record<string, Any>>(
        id: string,
        searchParams?: URLSearchParams,
      ): Observable<SanityDocument<R> | null> {
        return client
          .withConfig({
            useProjectHostname: false,
            apiHost: 'https://api.sanity.work',
            apiVersion: 'vX',
          })
          .observable.request({
            uri: `/projects/${projectId}/datasets/${datasetName}/doc/${id}?${searchParams?.toString() || ''}`,
            method: 'GET',
          })
          .pipe(map((res) => res.documents[0]))
      },
      getDocuments<R extends Record<string, Any>>(
        ids: string[],
        searchParams?: URLSearchParams,
      ): Observable<{
        documents: SanityDocument<R>[]
        omitted: {id: string; reason: 'existence' | 'permission'}[]
      }> {
        return client
          .withConfig({
            useProjectHostname: false,
            apiHost: 'https://api.sanity.work',
            apiVersion: 'vX',
          })
          .observable.request({
            uri: `/projects/${projectId}/datasets/${datasetName}/doc/${id}?${searchParams?.toString() || ''}`,
            method: 'GET',
          })
      },
      query<
        R = Any,
        Q extends Record<string, unknown> | undefined = QueryWithoutParams,
        G extends string = string,
      >(query: G, params: Q) {
        return client.observable
          .withConfig({
            useProjectHostname: false,
            apiHost: 'https://api.sanity.work',
            apiVersion: 'vX',
          })
          .request<{result: ClientReturn<G, R>}>({
            url: `/projects/${projectId}/datasets/${datasetName}/query`,
            method: 'POST',
            body: {query, params},
          })
          .pipe(map((res) => res.result))
      },
      listen<
        Q extends Record<string, string> | undefined = QueryWithoutParams,
        G extends string = string,
      >(query: G, params: Q, opts: {includeResult?: boolean} = {}) {
        // add $ as a prefix to all keys in the params
        const queryParams = Object.keys(params || {}).reduce<Record<string, string>>((acc, key) => {
          acc[`$${key}`] = `"${params![key]}"`
          return acc
        }, {})
        const allParams = {...queryParams, tag: 'sanity.studio.listen.gdr', query} as Record<
          string,
          string
        >
        if (opts.includeResult) {
          allParams.includeResult = 'true'
        }
        const paramsString = new URLSearchParams(allParams).toString()
        // todo: fix url
        const uri = `https://api.sanity.work/vX/projects/${projectId}/datasets/${datasetName}/listen?${paramsString}`
        return connectEventSource(
          () => new EventSource(uri, {withCredentials: true}),
          ['welcome', 'mutation'],
        )
      },
    } satisfies ReferenceClient
  }
  if (schemaType.resourceType === 'asset-library') {
    return {
      getDocument<R extends Record<string, Any>>(
        id: string,
        searchParams?: URLSearchParams,
      ): Observable<SanityDocument<R> | null> {
        return client.observable
          .request({
            useGlobalApi: true,
            uri: `/vX/asset-library/${schemaType.resourceId}/doc/${id}?${searchParams?.toString() || ''}`,
            method: 'GET',
          })
          .pipe(map((res) => res.documents[0]))
      },
      getDocuments<R extends Record<string, Any>>(
        ids: string[],
        searchParams?: URLSearchParams,
      ): Observable<{
        documents: SanityDocument<R>[]
        omitted: {id: string; reason: 'existence' | 'permission'}[]
      }> {
        return client.observable.request({
          useGlobalApi: true,
          uri: `/vX/asset-library/${schemaType.resourceId}/doc/${id}?${searchParams?.toString() || ''}`,
          method: 'GET',
        })
      },
      query<
        R = Any,
        Q extends Record<string, unknown> | undefined = QueryWithoutParams,
        G extends string = string,
      >(query: G, params: Q) {
        return client.observable
          .request<{result: ClientReturn<G, R>}>({
            useGlobalApi: true,
            uri: `/vX/asset-library/${schemaType.resourceId}/query`,
            method: 'POST',
            body: {query, params},
          })
          .pipe(map((res) => res.result))
      },
      listen<
        Q extends Record<string, string> | undefined = QueryWithoutParams,
        G extends string = string,
      >(query: G, params: Q) {
        const allParams = {...params, tag: 'listen', query}
        const paramsString = new URLSearchParams(allParams).toString()
        const uri = `https://api.sanity.work/vX/asset-libraries/${schemaType.resourceId}/listen?${paramsString}`
        return connectEventSource(() => new EventSource(uri, {}), ['welcome', 'mutation'])
      },
    } satisfies ReferenceClient
  }

  throw new Error('Invalid resource type')
}
