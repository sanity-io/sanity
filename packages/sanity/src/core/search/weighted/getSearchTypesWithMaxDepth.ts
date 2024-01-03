import type {ObjectSchemaType, Schema} from '@sanity/types'
import {SearchableType} from './types'
import {resolveSearchConfig} from '@sanity/schema/_internal'

/**
 * @internal
 */
export function getSearchTypesWithMaxDepth(
  types: ObjectSchemaType[],
  maxFieldDepth?: number,
): SearchableType[] {
  return types.map((type) => ({
    title: type.title,
    name: type.name,
    // eslint-disable-next-line camelcase
    __experimental_search: resolveSearchConfig(type, maxFieldDepth),
  }))
}
