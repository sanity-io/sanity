// @flow
import React from 'react'
import {SortableContainer, SortableElement, SortableHandle} from 'react-sortable-hoc'

type ValidAxis = 'x' | 'y' | 'xy'

type ListProps = {
  className: string,
  movingItemClass: string,
  useDragHandle: boolean,
  onSortEnd: ({oldIndex: number, newIndex: number}) => void,
  onSortStart: () => void,
  distance: number,
  lockToContainerEdges: boolean,
  transitionDuration: number,
  axis: ValidAxis,
  lockAxis: ValidAxis
}

export function createSortableList(element: Element) {
  // Delegate to SortableContainer from react-sortable-hoc
  const Sortable = SortableContainer(element)

  return class SortableList extends React.Component<ListProps> {
    handleSortStart = (_ignore /*{node, index, collection}*/, event) => {
      const {onSortStart} = this.props
      event.preventDefault()
      if (onSortStart) {
        onSortStart()
      }
    }
    render() {
      const {
        movingItemClass,
        distance,
        useDragHandle,
        lockToContainerEdges,
        axis,
        lockAxis,
        transitionDuration,
        onSortStart,
        onSortEnd,

        // Remove react-sortable-hoc props so they don't accidentally leak through usage of {...rest}
        /* eslint-disable react/prop-types */
        onSort,
        helperClass,
        pressDelay,
        pressThreshold,
        shouldCancelStart,
        onSortMove,
        useWindowAsScrollContainer,
        hideSortableGhost,
        lockOffset,
        getContainer,
        getHelperDimensions,
        /* eslint-enable react/prop-types */
        // ------------------------------
        ...rest
      } = this.props

      return (
        <Sortable
          {...rest}
          onSortStart={this.handleSortStart}
          onSortEnd={onSortEnd}
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
