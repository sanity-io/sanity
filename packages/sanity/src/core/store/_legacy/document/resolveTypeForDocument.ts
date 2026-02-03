import {type SanityClient} from '@sanity/client'
import {type Observable, of} from 'rxjs'

import {getPublishedId} from '../../../util'

export function resolveTypeForDocument(
  client: SanityClient,
  id: string,
  specifiedType = '*',
): Observable<string> {
  // if is resolved document type
  if (specifiedType && specifiedType !== '*') {
    return of(specifiedType)
  }

  const query = '*[sanity::versionOf($publishedId)][0]._type'

  return client.observable.fetch(
    query,
    {publishedId: getPublishedId(id)},
    {
      tag: 'document.resolve-type',
    },
  )
}
