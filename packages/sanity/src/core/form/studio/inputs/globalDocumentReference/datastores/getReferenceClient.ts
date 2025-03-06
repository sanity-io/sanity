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

import {globalDocumentReferenceApiVersion as apiVersion} from '../constants'

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
        const tag = searchParams?.get('tag') || undefined
        searchParams?.delete('tag')
        return client
          .withConfig({
            useProjectHostname: false,
            apiHost: 'https://api.sanity.work',
            apiVersion,
          })
          .observable.request({
            uri: `/projects/${projectId}/datasets/${datasetName}/doc/${id}?${searchParams?.toString() || ''}`,
            method: 'GET',
            tag,
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
        const tag = searchParams?.get('tag') || undefined
        searchParams?.delete('tag')
        return client
          .withConfig({
            useProjectHostname: false,
            apiHost: 'https://api.sanity.work',
            apiVersion,
          })
          .observable.request({
            uri: `/projects/${projectId}/datasets/${datasetName}/doc/${ids.join(',')}?${searchParams?.toString() || ''}`,
            method: 'GET',
            tag,
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
            apiVersion,
          })
          .request<{result: ClientReturn<G, R>}>({
            url: `/projects/${projectId}/datasets/${datasetName}/query`,
            method: 'POST',
            body: {query, params},
            tag: 'gdr.query',
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
        const uri = `${client.config().apiHost}/${apiVersion}/projects/${projectId}/datasets/${datasetName}/listen?${paramsString}`
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
        const tag = searchParams?.get('tag') || undefined
        searchParams?.delete('tag')
        return client
          .withConfig({
            useProjectHostname: false,
            apiVersion,
          })
          .observable.request({
            useGlobalApi: true,
            uri: `/asset-libraries/${schemaType.resourceId}/doc/${id}?${searchParams?.toString() || ''}`,
            method: 'GET',
            tag,
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
        const tag = searchParams?.get('tag') || undefined
        searchParams?.delete('tag')
        return client
          .withConfig({
            useProjectHostname: false,
            apiVersion,
          })
          .observable.request({
            useGlobalApi: true,
            uri: `/${apiVersion}/asset-libraries/${schemaType.resourceId}/doc/${ids.join(',')}?${searchParams?.toString() || ''}`,
            method: 'GET',
            tag,
          })
      },
      query<
        R = Any,
        Q extends Record<string, unknown> | undefined = QueryWithoutParams,
        G extends string = string,
      >(query: G, params: Q) {
        return client
          .withConfig({
            useProjectHostname: false,
            apiVersion,
          })
          .observable.request<{result: ClientReturn<G, R>}>({
            useGlobalApi: true,
            uri: `/asset-libraries/${schemaType.resourceId}/query`,
            method: 'POST',
            body: {query, params},
            tag: 'gdr.query',
          })
          .pipe(map((res) => res.result))
      },
      listen<
        Q extends Record<string, string> | undefined = QueryWithoutParams,
        G extends string = string,
      >(query: G, params: Q) {
        const allParams = {...params, tag: 'listen', query}
        const paramsString = new URLSearchParams(allParams).toString()
        const uri = `${client.config().apiHost}/${apiVersion}/asset-libraries/${schemaType.resourceId}/listen?${paramsString}`
        return connectEventSource(() => new EventSource(uri, {}), ['welcome', 'mutation'])
      },
    } satisfies ReferenceClient
  }
  throw new Error(`Invalid resource type "${schemaType.resourceType}"`)
}
