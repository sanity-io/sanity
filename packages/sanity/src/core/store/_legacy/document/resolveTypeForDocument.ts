import {SanityClient} from '@sanity/client'
import type {Observable} from 'rxjs'
import {of} from 'rxjs'
import {map} from 'rxjs/operators'
import {getDraftId, getPublishedId} from '../../../util'

export function resolveTypeForDocument(
  client: SanityClient,
  id: string,
  specifiedType = '*'
): Observable<string> {
  // if is resolved document type
  if (specifiedType && specifiedType !== '*') {
    return of(specifiedType)
  }

  const query = '*[_id in [$documentId, $draftId]]._type'
  const documentId = getPublishedId(id)
  const draftId = getDraftId(documentId)

  return client.observable.fetch(query, {documentId, draftId}).pipe(map((types) => types[0]))
}
