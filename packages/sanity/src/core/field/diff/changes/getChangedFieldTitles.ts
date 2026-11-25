import {type ObjectSchemaType} from '@sanity/types'

import {type ObjectDiff} from '../../types'
import {buildObjectChangeList} from './buildChangeList'
import {flattenChangeNode} from './helpers'

/**
 * The title paths of the fields `diff` changes, in schema order and each listed once, the way the
 * change list heads them: `#n` for an array item, when the change list shows its index.
 *
 * @internal
 */
export function getChangedFieldTitles(schemaType: ObjectSchemaType, diff: ObjectDiff): string[][] {
  const seen = new Set<string>()
  const titles: string[][] = []
  for (const change of buildObjectChangeList(schemaType, diff).flatMap(flattenChangeNode)) {
    if (change.hidden === true) continue
    const title = change.titlePath.flatMap((segment) => {
      if (typeof segment === 'string') return [segment]
      return change.showIndex ? [`#${(segment.toIndex ?? segment.fromIndex ?? 0) + 1}`] : []
    })
    const key = JSON.stringify(title)
    if (title.length === 0 || seen.has(key)) continue
    seen.add(key)
    titles.push(title)
  }
  return titles
}
