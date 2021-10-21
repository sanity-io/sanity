import type {Observable} from 'rxjs'
import {of} from 'rxjs'
import {map} from 'rxjs/operators'
import {getPublishedId, getDraftId} from '../../util/draftUtils'
import {versionedClient} from '../../client/versionedClient'

export function resolveTypeForDocument(id: string, specifiedType = '*'): Observable<string> {
  // if is resolved document type
  if (specifiedType && specifiedType !== '*') {
    return of(specifiedType)
  }

  const query = '*[_id in [$documentId, $draftId]]._type'
  const documentId = getPublishedId(id)
  const draftId = getDraftId(documentId)

  return versionedClient.observable
    .fetch(query, {documentId, draftId})
    .pipe(map((types) => types[0]))
}
