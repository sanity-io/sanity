import {type ObjectSchemaType} from '@sanity/types'

import {type ChangeNode, type ChangeTitlePath, type ObjectDiff} from '../../types'
import {buildObjectChangeList} from './buildChangeList'

function titleSegments(titlePath: ChangeTitlePath, showIndex: boolean): string[] {
  return titlePath.flatMap((segment) => {
    if (typeof segment === 'string') return [segment]
    return showIndex ? [`#${(segment.toIndex ?? segment.fromIndex ?? 0) + 1}`] : []
  })
}

/**
 * The title paths of the fields `diff` changes, in schema order and each listed once, the way the
 * change list heads them: `#n` for an array item, when the change list shows its index.
 *
 * @internal
 */
export function getChangedFieldTitles(schemaType: ObjectSchemaType, diff: ObjectDiff): string[][] {
  const seen = new Set<string>()
  const titles: string[][] = []

  // The title path of a change in a group is relative to the group, which heads its changes in
  // the change list, so the titles of the groups it is in come first.
  const visit = (change: ChangeNode, groupTitle: string[]) => {
    if (change.hidden === true) return
    if (change.type === 'group') {
      const title = groupTitle.concat(titleSegments(change.titlePath, true))
      for (const child of change.changes) visit(child, title)
      return
    }
    const title = groupTitle.concat(titleSegments(change.titlePath, change.showIndex))
    const key = JSON.stringify(title)
    if (title.length === 0 || seen.has(key)) return
    seen.add(key)
    titles.push(title)
  }
  for (const change of buildObjectChangeList(schemaType, diff)) visit(change, [])
  return titles
}
