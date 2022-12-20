import {Box, Card, Grid} from '@sanity/ui'
import React, {ComponentProps, useCallback, useMemo} from 'react'
import styled, {css} from 'styled-components'
import {
  AutoScrollOptions,
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  SensorOptions,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {CSS, Transition} from '@dnd-kit/utilities'
import {restrictToHorizontalAxis, restrictToVerticalAxis} from '@dnd-kit/modifiers'
import {SortableItemIdContext} from './DragHandle'
import {restrictToParentElementWithMargins} from './dndkit-modifier/restrictToParentElementWithMargins'

export const MOVING_ITEM_CLASS_NAME = 'moving'

const ListItem = styled(Box)<ComponentProps<typeof Box> & {$moving?: boolean}>`
  ${(props) =>
    props.$moving &&
    css`
      z-index: 10000;
      /* prevents hover-effects etc on the dragged element  */
      pointer-events: none;
    `}
`

const AUTO_SCROLL_OPTIONS: AutoScrollOptions = {
  threshold: {
    x: 0,
    y: 0.02,
  },
}
const SENSOR_OPTIONS: SensorOptions = {
  coordinateGetter: sortableKeyboardCoordinates,
}

const TRANSITION = {
  duration: 200,
  easing: 'ease',
}

type Axis = 'x' | 'y'

function restrictToAxis(axis: Axis) {
  return axis === 'x' ? restrictToHorizontalAxis : restrictToVerticalAxis
}
function sortingStrategy(axis: Axis) {
  return axis === 'x' ? horizontalListSortingStrategy : verticalListSortingStrategy
}

function SortableList(props: ListProps) {
  const {items, axis, onItemMove, onItemMoveStart, onItemMoveEnd, children, ...rest} = props

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, SENSOR_OPTIONS))

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const {active, over} = event

      if (active.id !== over?.id) {
        onItemMove?.({
          fromIndex: items.indexOf(active.id as string),
          toIndex: items.indexOf(over?.id as string),
        })
      }

      onItemMoveEnd?.()
    },
    [items, onItemMove, onItemMoveEnd]
  )
  const modifiers = useMemo(
    () => [restrictToParentElementWithMargins({y: 4}), ...(axis ? [restrictToAxis(axis)] : [])],
    [axis]
  )

  return (
    <DndContext
      sensors={sensors}
      autoScroll={AUTO_SCROLL_OPTIONS}
      modifiers={modifiers}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      onDragStart={onItemMoveStart}
    >
      <SortableContext items={items} strategy={axis ? sortingStrategy(axis) : undefined}>
        <Grid {...rest}>{children}</Grid>
      </SortableContext>
    </DndContext>
  )
}

function SortableListItem(props: ItemProps) {
  const {id, children, disableTransition} = props
  const {setNodeRef, transform, transition, active} = useSortable({
    id,
    transition: disableTransition ? null : TRANSITION,
  })

  const isActive = id === active?.id

  const style = useMemo(
    () =>
      ({
        transform: CSS.Translate.toString(transform),
        transition,
        pointerEvents: active ? 'none' : undefined,
      } as const),
    [transform, transition, active]
  )
  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      $moving={isActive}
      className={isActive ? MOVING_ITEM_CLASS_NAME : ''}
    >
      {children}
    </ListItem>
  )
}

interface ListProps extends ComponentProps<typeof Grid> {
  sortable?: boolean
  axis?: Axis
  items: string[]
  onItemMove?: (event: {fromIndex: number; toIndex: number}) => void
  onItemMoveStart?: () => void
  onItemMoveEnd?: () => void
  children?: React.ReactNode
}

export function List(props: ListProps) {
  const {onItemMove, onItemMoveEnd, onItemMoveStart, sortable, ...rest} = props

  // Note: this is here to make SortableList API compatible with onItemMove
  const handleSortEnd = useCallback(
    (event: {fromIndex: number; toIndex: number}) => {
      onItemMove?.(event)
    },
    [onItemMove]
  )

  return sortable ? (
    <SortableList
      onItemMove={handleSortEnd}
      onItemMoveStart={onItemMoveStart}
      onItemMoveEnd={onItemMoveEnd}
      {...rest}
    />
  ) : (
    <Grid {...rest} />
  )
}

interface ItemProps {
  id: string

  // false positive:
  // eslint-disable-next-line react/no-unused-prop-types
  sortable?: boolean
  disableTransition?: boolean
  children?: React.ReactNode
}

export function Item(props: ItemProps & ComponentProps<typeof Card>) {
  const {sortable, ...rest} = props
  return (
    <SortableItemIdContext.Provider value={props.id}>
      {sortable ? <SortableListItem {...rest} /> : <ListItem {...rest} />}
    </SortableItemIdContext.Provider>
  )
}
