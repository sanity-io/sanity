import {type SanityClient} from '@sanity/client'
import {type Observable, of} from 'rxjs'
import {map} from 'rxjs/operators'

export function resolveTypeForDocument(
  client: SanityClient,
  id: string,
  specifiedType = '*',
): Observable<string> {
  // if is resolved document type
  if (specifiedType && specifiedType !== '*') {
    return of(specifiedType)
  }

  const query = '*[sanity::versionOf($id)]._type'

  return client.observable.fetch(query, {id}).pipe(map((types) => types[0]))
}
