import {isReference} from '@sanity/types'
import {omit} from 'lodash'

/**
 * This is almost identical to the existing `strengthenOnPublish` function, but it omits only the
 * `_weak` property.
 *
 * The strengthen-on-publish process is not necessary for documents inside a release, and in fact
 * must be skipped in order for release preflight checks to function. Therefore, when creating a
 * version of a document, the `_weak` property must be removed from any existing reference that is
 * set to strengthen on publish.
 *
 * The `_strengthenOnPublish` field itself is always set, regardless of whether the
 * strengthen-on-publish process should be used. This is because the field is used to store details
 * such as the non-existing document's type, which Studio uses to render reference previews.
 *
 * Content Lake will only strengthen the reference if **both** `_strengthenOnPublish` and `_weak`
 * are truthy.
 *
 * Yes, this is confusing.
 */
export function prepareVersionReferences<T = any>(obj: T): T {
  if (isReference(obj)) {
    const isSchemaMandatedWeakReference = obj._strengthenOnPublish?.weak === true
    if (!isSchemaMandatedWeakReference) {
      return omit(obj, ['_weak']) as T
    }
    return obj
  }
  if (typeof obj !== 'object' || !obj) return obj
  if (Array.isArray(obj)) return obj.map(prepareVersionReferences) as T
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, prepareVersionReferences(value)] as const),
  ) as T
}
