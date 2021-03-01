import GridItem from '../grid/GridItem'
import {createSortableItem} from '../sortable/sortable-factories'

const SortableGridListItem = createSortableItem(GridItem as any)

SortableGridListItem.displayName = 'SortableGridListItem'

export default SortableGridListItem
