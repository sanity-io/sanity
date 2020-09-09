import List from '../default/List'
import {createSortableList} from './sortable-factories'

const SortableList = createSortableList(List as any, {
  axis: 'y',
  lockAxis: 'y',
  lockToContainerEdges: true,
  useDragHandle: true
})

SortableList.displayName = 'SortableList'

export default SortableList
