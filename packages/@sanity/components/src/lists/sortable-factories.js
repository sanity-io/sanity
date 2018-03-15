// @flow
import React from 'react'
import {SortableContainer, SortableElement, SortableHandle} from 'react-sortable-hoc'

type ValidAxis = 'x' | 'y' | 'xy'

type ListProps = {
  className: string,
  movingItemClass: string,
  useDragHandle: boolean,
  onSort: ({oldIndex: number, newIndex: number}) => void,
  distance: number,
  lockToContainerEdges: boolean,
  transitionDuration: number,
  axis: ValidAxis,
  lockAxis: ValidAxis
}

export function createSortableList(element: Element) {
  // Delegate to SortableContainer from react-sortable-hoc
  const Sortable = SortableContainer(element)

  return function SortableList(props: ListProps) {
    const {
      onSort,
      movingItemClass,
      distance,
      useDragHandle,
      lockToContainerEdges,
      axis,
      lockAxis,
      transitionDuration,
      // Remove react-sortable-hoc props so they don't accidentally leak through usage of {...rest}
      /* eslint-disable react/prop-types */
      helperClass,
      pressDelay,
      pressThreshold,
      shouldCancelStart,
      // onSortStart,
      onSortMove,
      //onSortEnd,
      useWindowAsScrollContainer,
      hideSortableGhost,
      lockOffset,
      getContainer,
      getHelperDimensions,
      /* eslint-enable react/prop-types */
      // ------------------------------
      ...rest
    } = props

    return (
      <Sortable
        {...rest}
        // onSortEnd={onSort}
        distance={distance}
        helperClass={movingItemClass}
        lockToContainerEdges={lockToContainerEdges}
        transitionDuration={transitionDuration}
        axis={axis}
        lockAxis={lockAxis}
        useDragHandle={useDragHandle}
      />
    )
  }
}

type ItemProps = {
  index: number
}

export function createSortableItem(element: Element) {
  const Sortable = SortableElement(element)
  // Delegate to SortableElement from react-sortable-hoc
  return function SortableItem(props: ItemProps) {
    const {
      collection,
      disabled, // omit to avoid {...rest} leakage
      index,
      ...rest
    } = props
    return <Sortable index={index} {...rest} />
  }
}

export function createDragHandle(element: Element) {
  return SortableHandle(element)
}
