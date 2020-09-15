/* eslint-disable react/prop-types */

import React, {forwardRef, useCallback} from 'react'
import {
  SortableContainer,
  // eslint-disable-next-line import/named
  SortableContainerProps,
  SortableElement,
  SortableHandle,
  // eslint-disable-next-line import/named
  SortEvent,
  // eslint-disable-next-line import/named
  SortStart
} from 'react-sortable-hoc'
import {
  DragHandleComponent,
  ItemComponent,
  ListComponent,
  SortableItemComponent,
  SortableListComponent,
  SortableListProps
} from '../types'

export function createSortableList(
  element: ListComponent,
  defaultProps: Partial<SortableContainerProps> = {}
): SortableListComponent {
  const Sortable = SortableContainer(element)

  const SortableList = forwardRef((props: SortableListProps, ref) => {
    const {onSortStart} = props

    const handleSortStart = useCallback((sort: SortStart, event: SortEvent) => {
      event.preventDefault()

      if (onSortStart) {
        onSortStart(sort, event)
      }
    }, [])

    return <Sortable {...defaultProps} {...props} onSortStart={handleSortStart} ref={ref as any} />
  })

  SortableList.displayName = 'SortableList'

  return SortableList as any
}

export function createSortableItem(element: ItemComponent): SortableItemComponent {
  const SortableItem = SortableElement(element)

  SortableItem.displayName = 'SortableItem'

  return SortableItem as any
}

export function createDragHandle(
  element: React.ComponentType<{className?: string}>
): DragHandleComponent {
  return SortableHandle(element) as any
}
