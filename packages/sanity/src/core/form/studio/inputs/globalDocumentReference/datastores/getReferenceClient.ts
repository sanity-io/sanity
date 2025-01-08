import {
  type Any,
  type ClientReturn,
  type QueryWithoutParams,
  type SanityClient,
} from '@sanity/client'
import {type GlobalDocumentReferenceSchemaType} from '@sanity/types'
import {map, type Observable} from 'rxjs'

export type ReferenceClient<
  R = Any,
  Q extends QueryWithoutParams = QueryWithoutParams,
  G extends string = string,
> = (query: G, params?: Q | QueryWithoutParams) => Observable<ClientReturn<G, R>>

export function getReferenceClient(
  client: SanityClient,
  schemaType: GlobalDocumentReferenceSchemaType,
): ReferenceClient {
  if (schemaType.resourceType === 'dataset') {
    const [projectId, datasetName] = schemaType.resourceId.split('.', 2)
    return (query, params) =>
      client.observable
        .request<ClientReturn<string, Any>>({
          useGlobalApi: true,
          uri: `/vX/projects/${projectId}/datasets/${datasetName}/query`,
          method: 'POST',
          body: {query, params},
        })
        .pipe(map((res) => res.result))
  }
  if (schemaType.resourceType === 'asset-library') {
    return (query, params) =>
      client.observable
        .request<ClientReturn<string, Any>>({
          useGlobalApi: true,
          uri: `/vX/asset-library/${schemaType.resourceId}`,
          method: 'POST',
          body: {query, params},
        })
        .pipe(map((res) => res.result))
  }

  throw new Error('Invalid resource type')
}
