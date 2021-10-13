import type {Observable} from 'rxjs'
import {of} from 'rxjs'
import {map} from 'rxjs/operators'
import {getPublishedId, getDraftId} from '../../util/draftUtils'
import {versionedClient} from '../../client/versionedClient'

export function resolveTypeForDocument(id: string, specifiedType?: string): Observable<string> {
  if (isResolvedDocumentType(specifiedType)) {
    return of(specifiedType)
  }

  const query = '*[_id in [$documentId, $draftId]]._type'
  const documentId = getPublishedId(id)
  const draftId = getDraftId(documentId)

  return versionedClient.observable
    .fetch(query, {documentId, draftId})
    .pipe(map((types) => types[0]))
}

function isResolvedDocumentType(specifiedType?: string): specifiedType is string {
  return Boolean(specifiedType && specifiedType !== '*')
}
