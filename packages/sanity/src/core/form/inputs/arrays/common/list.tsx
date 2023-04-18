import {Box, Card, Grid} from '@sanity/ui'
import React, {
  type ComponentProps,
  type ForwardedRef,
  forwardRef,
  memo,
  useCallback,
  useMemo,
} from 'react'
import styled, {css} from 'styled-components'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type {SensorOptions, AutoScrollOptions, DragStartEvent, DragEndEvent} from '@dnd-kit/core'
import {
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {CSS} from '@dnd-kit/utilities'
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

const SortableList = memo(function SortableList(props: ListProps) {
  const {items, axis, onItemMove, onItemMoveStart, onItemMoveEnd, children, ...rest} = props

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, SENSOR_OPTIONS))

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const {active, over} = event

      if (active.id !== over?.id) {
        onItemMove?.({
          fromIndex: active.data.current?.sortable?.index,
          toIndex: over?.data.current?.sortable?.index,
        })
      }

      onItemMoveEnd?.()
    },
    [onItemMove, onItemMoveEnd]
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
})

const SortableListItem = forwardRef<HTMLDivElement, ItemProps>(function SortableListItem(
  props,
  ref
) {
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

  // This sets the ref on the component for both sorting and for virtualizer
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      setNodeRef(node)
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    },
    [ref, setNodeRef]
  )

  return (
    <ListItem
      ref={setRef}
      style={style}
      $moving={isActive}
      className={isActive ? MOVING_ITEM_CLASS_NAME : ''}
      data-index={props['data-index']}
    >
      {children}
    </ListItem>
  )
})

interface ListProps extends ComponentProps<typeof Grid> {
  sortable?: boolean
  axis?: Axis
  items: string[]
  onItemMove?: (event: {fromIndex: number; toIndex: number}) => void
  onItemMoveStart?: (event: DragStartEvent) => void
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
  'data-index'?: number
}

export const Item = forwardRef(function Item(
  props: ItemProps & ComponentProps<typeof Card>,
  ref: ForwardedRef<HTMLDivElement>
) {
  const {sortable, ...rest} = props
  return (
    <SortableItemIdContext.Provider value={props.id}>
      {sortable ? <SortableListItem ref={ref} {...rest} /> : <ListItem ref={ref} {...rest} />}
    </SortableItemIdContext.Provider>
  )
})
