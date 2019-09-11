import React from 'react'
import PropTypes from 'prop-types'
import {SortableContainer, SortableElement, SortableHandle} from 'react-sortable-hoc'

const ValidAxis = PropTypes.oneOf(['x', 'y', 'xy'])

export function createSortableList(element) {
  // Delegate to SortableContainer from react-sortable-hoc
  const Sortable = SortableContainer(element)

  return class SortableList extends React.Component {
    static propTypes = {
      className: PropTypes.string,
      movingItemClass: PropTypes.string,
      useDragHandle: PropTypes.bool,
      onSortEnd: PropTypes.func, //(event: {oldIndex: number; newIndex: number}) => void
      onSortStart: PropTypes.func, //() => void
      distance: PropTypes.number,
      lockToContainerEdges: PropTypes.bool,
      transitionDuration: PropTypes.number,
      axis: ValidAxis,
      lockAxis: ValidAxis
    }
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

export function createSortableItem(element) {
  const Sortable = SortableElement(element)
  // Delegate to SortableElement from react-sortable-hoc
  function SortableItem(props) {
    const {
      /* eslint-disable react/prop-types */
      // omit to avoid {...rest} leakage
      collection,
      disabled,
      index,
      /* eslint-disable react/prop-types */
      ...rest
    } = props
    return <Sortable index={index} {...rest} />
  }
  SortableItem.proTypes = {
    collection: PropTypes.number,
    disabled: PropTypes.boolean
  }
  return SortableItem
}

export function createDragHandle(element) {
  return SortableHandle(element)
}
