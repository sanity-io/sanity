import GridList from '../grid/GridList'
import {createSortableList} from '../sortable/sortable-factories'

const SortableGridList = createSortableList(GridList as any, {
  axis: 'xy',
  distance: 1,
  lockToContainerEdges: true,
  transitionDuration: 600,
})

SortableGridList.displayName = 'SortableGridList'

export default SortableGridList
