import React from 'react'
import {SortableContainerProps} from 'react-sortable-hoc'
import {
  DragHandleComponent,
  ItemComponent,
  ListComponent,
  SortableItemComponent,
  SortableListComponent,
} from '../types'
export declare function createSortableList(
  element: ListComponent,
  defaultProps?: Partial<SortableContainerProps>
): SortableListComponent
export declare function createSortableItem(element: ItemComponent): SortableItemComponent
export declare function createDragHandle(
  element: React.ComponentType<{
    className?: string
  }>
): DragHandleComponent
