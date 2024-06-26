import {deburr} from 'lodash'

import {type TreeEditingMenuItem} from '../../types'
import {type SearchableTreeEditingMenuItem} from './types'

/**
 * Flattens a list of items and their children into a single list.
 */
export function flattenItems(items: TreeEditingMenuItem[]): TreeEditingMenuItem[] {
  const result: TreeEditingMenuItem[] = items.reduce(
    (acc: TreeEditingMenuItem[], item: TreeEditingMenuItem) => {
      if (item?.children) {
        return [...acc, item, ...flattenItems(item.children)]
      }

      return [...acc, item]
    },
    [],
  )

  // Remove the children property from the items
  // as we only want to return the items themselves
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return result.map(({children, ...item}) => item)
}

/**
 * Returns a list of items that match the search query.
 */
export function treeEditingSearch(
  items: SearchableTreeEditingMenuItem[],
  query: string,
): TreeEditingMenuItem[] {
  // Flatten the items list so we can search through all items and their children
  const flattenItemsList = flattenItems(items) as SearchableTreeEditingMenuItem[]

  // We use deburr to remove diacritics from the query and the item titles. This way we can
  // search for "nino" and get results for "niño" as well.
  const deburredQuery = deburr(query).toLocaleLowerCase()

  const filtered = flattenItemsList
    ?.filter((option) => {
      const deburredTitle = deburr(option.title || '').toLocaleLowerCase()

      return deburredTitle.includes(deburredQuery)
    })
    // Sort the most relevant results first
    ?.sort((a, b) => {
      const matchA = a.title?.startsWith(deburredQuery)
      const matchB = b.title?.startsWith(deburredQuery)

      if (matchA && !matchB) return -1
      if (!matchA && matchB) return 1

      return 0
    })

  return filtered
}
