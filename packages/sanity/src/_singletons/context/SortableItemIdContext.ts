import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const SortableItemIdContext: React.Context<string | null> = createContext<string | null>(
  'sanity/_singletons/context/sortable-item-id',
  null,
)
