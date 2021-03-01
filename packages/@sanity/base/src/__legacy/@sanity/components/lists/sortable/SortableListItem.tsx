import ListItem from '../default/ListItem'
import {createSortableItem} from './sortable-factories'

const SortableListItem = createSortableItem(ListItem as any)

SortableListItem.displayName = 'SortableListItem'

export default SortableListItem
