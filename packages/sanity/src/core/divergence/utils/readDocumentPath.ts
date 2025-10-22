import {type SanityDocument} from '@sanity/client'
import {type OperatorFunction, filter, from, switchMap, take} from 'rxjs'

import {type FlattenedPair, flattenObject} from './flatten'

/**
 * @internal
 */
export function readDocumentPath(path: string): OperatorFunction<SanityDocument, FlattenedPair> {
  return switchMap((document) =>
    from(flattenObject(document)).pipe(
      filter(([nodeFlatPath]) => nodeFlatPath === path),
      take(1),
    ),
  )
}
