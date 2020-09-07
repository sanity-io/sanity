import {omit} from 'lodash'
import React from 'react'
import {
  SortableContainer,
  SortableContainerProps,
  SortableElement,
  SortableElementProps,
  SortableHandle
} from 'react-sortable-hoc'

interface SortableListProps {
  className?: string
  movingItemClass?: string
  useDragHandle?: boolean
  onSortEnd?: (event: {oldIndex: number; newIndex: number}) => void
  onSortStart?: () => void
  distance?: number
  lockToContainerEdges?: boolean
  transitionDuration?: number
  axis?: 'x' | 'y' | 'xy'
  lockAxis?: 'x' | 'y' | 'xy'
}

export function createSortableList(element: React.ComponentType<unknown>) {
  // Delegate to SortableContainer from react-sortable-hoc
  const Sortable = SortableContainer(element)

  return class SortableList extends React.Component<SortableListProps & SortableContainerProps> {
    handleSortStart = (_ignore /*{node, index, collection}*/, event) => {
      const {onSortStart} = this.props

      event.preventDefault()

      if (onSortStart) {
        onSortStart()
      }
    }

    render() {
      // Remove react-sortable-hoc props so they don't accidentally leak through usage of {...rest}
      const props: SortableListProps = omit(
        this.props,
        'axis',
        'lockAxis',
        'helperClass',
        'transitionDuration',
        'pressDelay',
        'pressThreshold',
        'distance',
        'shouldCancelStart',
        'onSortStart',
        'onSortMove',
        'onSortEnd',
        'useDragHandle',
        'useWindowAsScrollContainer',
        'hideSortableGhost',
        'lockToContainerEdges',
        'lockOffset',
        'getContainer',
        'getHelperDimensions'
      )

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
        ...rest
      } = props

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

export function createSortableItem(
  element: React.ComponentType<React.HTMLProps<HTMLLIElement>>
): React.ComponentType<SortableElementProps & {className?: string}> {
  const Sortable = SortableElement(element)

  function SortableItem(props: SortableElementProps) {
    return <Sortable {...props} />
  }

  return SortableItem
}

export function createDragHandle(element: React.ComponentType<{className?: string}>) {
  return SortableHandle(element)
}
