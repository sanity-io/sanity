import {resolveSearchConfig} from '@sanity/schema/_internal'
import {type ObjectSchemaType} from '@sanity/types'

import {type SearchableType} from '../common'

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
