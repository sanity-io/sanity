import {toPlainText} from '@portabletext/react'
import {isPortableTextBlock} from '@portabletext/toolkit'
import {type ClientPerspective, type QueryParams} from '@sanity/client'
import {type ApplySourceDocumentsUpdateFunction} from '@sanity/client/csm'
import {type FIXME} from 'sanity'

/**
 * Used by `applySourceDocuments`
 * @internal
 */
export const mapChangedValue: ApplySourceDocumentsUpdateFunction = (
  changedValue: FIXME,
  {previousValue},
) => {
  if (typeof previousValue === 'string') {
    if (typeof changedValue === 'number') {
      // If the string() function was used in the query, we need to convert the source value to a string as well
      return `${changedValue}`
    }
    // If it's an array in the source, but a string in the query response, it could be pt::text
    if (Array.isArray(changedValue)) {
      if (changedValue.length === 0) {
        // If it's empty assume it's PT and return an empty string
        return ''
      }
      // If the array contains any valid block type, assume the GROQ initially used pt::text on it and do the same conversion
      if (changedValue.some((node) => typeof node === 'object' && isPortableTextBlock(node))) {
        return toPlainText(changedValue)
      }
    }
  }

  return changedValue
}

/**
 * @internal
 */
export type QueryCacheKey = `${string}:${string}:${string}`
/**
 * @internal
 */
export function getQueryCacheKey(
  perspective: ClientPerspective,
  query: string,
  params: QueryParams,
): QueryCacheKey {
  return `${perspective}:${query}:${JSON.stringify(params)}`
}
