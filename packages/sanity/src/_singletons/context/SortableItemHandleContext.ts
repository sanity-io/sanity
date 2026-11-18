import type {DOMAttributes, HTMLAttributes} from 'react'
import {createContext} from 'react'

/**
 * @internal
 */
export interface SortableItemHandleContextValue {
  attributes: HTMLAttributes<HTMLElement>
  listeners: DOMAttributes<HTMLElement> | undefined
  setActivatorNodeRef: (element: HTMLElement | null) => void
}

/**
 * The activator props of the closest sortable array item, for its drag handle to spread.
 *
 * The handle must not call `useSortable` itself: dnd-kit keeps one draggable and one droppable
 * per id, so a second registration under the item's id (one that never attaches a node) can
 * replace the item's own, and a drag then ends without a drop target.
 *
 * @internal
 */
export const SortableItemHandleContext = createContext<SortableItemHandleContextValue | null>(null)
