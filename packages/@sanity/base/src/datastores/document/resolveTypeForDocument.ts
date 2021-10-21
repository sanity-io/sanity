import type {Observable} from 'rxjs'
import {of} from 'rxjs'
import {map} from 'rxjs/operators'
import {getPublishedId, getDraftId} from '../../util/draftUtils'
import {versionedClient} from '../../client/versionedClient'

export interface ResolveDocumentTypeOptions {
  client?: {observable: {fetch: (query: string, params: Record<string, any>) => Observable<any>}}
}

export function resolveTypeForDocument(
  id: string,
  specifiedType?: string,
  options?: ResolveDocumentTypeOptions
): Observable<string> {
  if (isResolvedDocumentType(specifiedType)) {
    return of(specifiedType)
  }

  const query = '*[_id in [$documentId, $draftId]]._type'
  const documentId = getPublishedId(id)
  const draftId = getDraftId(documentId)
  const sanityClient = options?.client || versionedClient

  return sanityClient.observable.fetch(query, {documentId, draftId}).pipe(map((types) => types[0]))
}

function isResolvedDocumentType(specifiedType?: string): specifiedType is string {
  return Boolean(specifiedType && specifiedType !== '*')
}
