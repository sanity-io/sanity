import {List as DefaultList, Item as DefaultListItem} from 'part:@sanity/components/lists/default'
import {
  List as SortableList,
  Item as SortableListItem,
} from 'part:@sanity/components/lists/sortable'

import {List as GridList, Item as GridListItem} from 'part:@sanity/components/lists/grid'

import {
  List as SortableGridList,
  Item as SortableGridListItem,
} from 'part:@sanity/components/lists/sortable-grid'

const SORTABLE_GRID = {List: SortableGridList, Item: SortableGridListItem}
const SORTABLE_LIST = {List: SortableList, Item: SortableListItem}
const NON_SORTABLE_GRID = {List: GridList, Item: GridListItem}
const NON_SORTABLE_LIST = {List: DefaultList, Item: DefaultListItem}

export default function resolveListComponents(isSortable: boolean, isGrid: boolean) {
  if (isSortable) {
    return isGrid ? SORTABLE_GRID : SORTABLE_LIST
  }
  return isGrid ? NON_SORTABLE_GRID : NON_SORTABLE_LIST
}
