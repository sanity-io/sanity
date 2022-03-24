import React from 'react'
import type {SortableContainerProps} from 'react-sortable-hoc'
import {SortableContainer, SortableElement, SortableHandle} from 'react-sortable-hoc'
import {FIXME} from '../../../types'

export const MOVING_ITEM_CLASS_NAME = 'moving'
export const DRAG_HANDLE_ATTRIBUTE = 'data-drag-handle'

// higher order components to make a sortable list/item components
type ExposedSortableProps = {
  onSortStart?: () => void
  onSortEnd?: (event: {newIndex: number; oldIndex: number}) => void
}

export function sortableHandle<Props>(
  Component: React.ComponentType<Props>
): React.ComponentType<Props> {
  return SortableHandle(Component)
}

// Wrapper to avoid accidental leaking of react-sortable-hoc props
export function sortableItem<Props>(
  Component: React.ComponentType<Props>
): React.ComponentType<Props & {index: number}> {
  return SortableElement(Component)
}

// Wrapper to avoid accidental leaking of react-sortable-hoc props
function sortableContainer<Props>(
  Component: React.ComponentType<Props>,
  options: SortableContainerProps
) {
  const Container = SortableContainer(
    React.forwardRef(function Sortable(
      props: Props & ExposedSortableProps,
      forwardedRef: React.ForwardedRef<React.ComponentType<Props>>
    ) {
      return <Component {...props} ref={forwardedRef} />
    })
  ) as FIXME as React.ComponentType<SortableContainerProps> // there are some wonky typings from react-sortable-hoc

  return React.forwardRef(function SortableList(
    props: Props & ExposedSortableProps,
    ref: React.ForwardedRef<React.ComponentType<Props>>
  ) {
    return <Container {...props} {...options} ref={ref} />
  })
}

const KeyCode = {
  Space: 32,
  Enter: 13,
  Esc: 27,
  Up: 38,
  Left: 37,
  Right: 39,
  Down: 40,
}

const KEYCODES = {
  lift: [KeyCode.Space, KeyCode.Enter],
  drop: [KeyCode.Space, KeyCode.Enter],
  cancel: [KeyCode.Esc],
  up: [KeyCode.Left, KeyCode.Up],
  down: [KeyCode.Right, KeyCode.Down],
}

export function sortableGrid<Props>(Component: React.ComponentType<Props>) {
  return sortableContainer(Component, {
    helperClass: MOVING_ITEM_CLASS_NAME,
    keyCodes: KEYCODES,
    axis: 'xy',
    lockAxis: 'xy',
    useDragHandle: true,
    shouldCancelStart,
  })
}

export function sortableList<Props>(Component: React.ComponentType<Props>) {
  return sortableContainer(Component, {
    helperClass: MOVING_ITEM_CLASS_NAME,
    keyCodes: KEYCODES,
    axis: 'y',
    lockAxis: 'y',
    useDragHandle: true,
    shouldCancelStart,
  })
}

// Cancel sorting if the event target is not drag handle
function shouldCancelStart(event: React.UIEvent<HTMLElement>) {
  return !isDragHandle(event.target as HTMLElement)
}

function isDragHandle(element: HTMLElement) {
  return element.matches(`[${DRAG_HANDLE_ATTRIBUTE}="true"],[${DRAG_HANDLE_ATTRIBUTE}="true"] *`)
}
