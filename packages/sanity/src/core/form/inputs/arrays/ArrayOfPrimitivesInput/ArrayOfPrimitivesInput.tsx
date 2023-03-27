import React, {useCallback, useMemo, useRef, useState} from 'react'
import {
  defaultRangeExtractor,
  useVirtualizer,
  type VirtualizerOptions,
  type Range,
} from '@tanstack/react-virtual'
import type {DragStartEvent} from '@dnd-kit/core'
import {Card, Stack, Text, useBoundaryElement, useTheme} from '@sanity/ui'
import {ArrayOfPrimitivesInputProps} from '../../../types'
import {Item, List} from '../common/list'
import {PrimitiveItemProps} from '../../../types/itemProps'
import {ArrayOfPrimitivesItem} from '../../../members'
import {ErrorItem} from '../ArrayOfObjectsInput/List/ErrorItem'
import {UploadTargetCard} from '../common/UploadTargetCard'
import {getEmptyValue} from './getEmptyValue'

import {PrimitiveValue} from './types'
import {ItemRow} from './ItemRow'
import {ArrayOfPrimitivesFunctions} from './ArrayOfPrimitivesFunctions'

// Note: this should be a class component until React provides support for a hook version of getSnapshotBeforeUpdate
/** @beta */
// _element: HTMLElement | null = null

// focus() {
//   if (this._element) {
//     this._element.focus()
//   }
// }

// getSnapshotBeforeUpdate(prevProps: ArrayOfPrimitivesInputProps) {
//   const {focusPath: prevFocusPath = [], value: prevValue = []} = prevProps
//   const {focusPath = [], value = []} = this.props
//   if (prevFocusPath[0] === focusPath[0] && prevValue.length !== value.length) {
//     // the length of the array has changed, but the focus path has not, which may happen if someone inserts or removes a new item above the one currently in focus
//     const focusIndex = focusPath[0]

//     const selection = window.getSelection()
//     if (!(selection?.focusNode instanceof HTMLElement)) {
//       return null
//     }

//     const input = selection.focusNode?.querySelector('input,textarea')

//     return input instanceof HTMLInputElement
//       ? {
//           prevFocusedIndex: focusIndex,
//           restoreSelection: {
//             text: selection.toString(),
//             start: input.selectionStart,
//             end: input.selectionEnd,
//             value: input.value,
//           },
//         }
//       : {}
//   }

//   return null
// }

// componentDidUpdate(
//   prevProps: ArrayOfPrimitivesInputProps,
//   prevState: Record<string, unknown>,
//   snapshot?: {restoreSelection: {start: number; end: number}; prevFocusedIndex: number}
// ) {
//   const {onIndexFocus} = this.props
//   if (snapshot?.restoreSelection && prevProps.value) {
//     const prevFocusedValue = prevProps.value[snapshot.prevFocusedIndex]

//     const nearestIndex = nearestIndexOf(
//       this.props.value || [],
//       snapshot.prevFocusedIndex,
//       prevFocusedValue
//     )

//     if (nearestIndex === -1) {
//       return
//     }
//     const newInput = this._element?.querySelector(
//       `[data-item-index='${nearestIndex}'] input,textarea`
//     )

//     if (newInput instanceof HTMLInputElement) {
//       newInput.focus()
//       try {
//         newInput.setSelectionRange(snapshot.restoreSelection.start, snapshot.restoreSelection.end)
//       } catch {
//         // not all inputs supports selection (e.g. <input type="number" />)
//       }
//     }
//     onIndexFocus(nearestIndex)
//   }
// }

/** @beta */
export function ArrayOfPrimitivesInput(props: ArrayOfPrimitivesInputProps) {
  const [disableTransition, setDisableTransition] = useState(false)
  // Stores the index of the item being dragged
  const [activeDragItemIndex, setActiveDragItemIndex] = useState<number | null>(null)
  const {space} = useTheme().sanity

  const {
    arrayFunctions: ArrayFunctions = ArrayOfPrimitivesFunctions,
    elementProps,
    members,
    onChange,
    onIndexFocus,
    onItemAppend,
    onItemPrepend,
    onItemRemove,
    onMoveItem,
    onUpload,
    readOnly,
    renderInput,
    resolveUploader,
    schemaType,
    value = [],
  } = props

  const handleAppend = useCallback(
    (itemValue: PrimitiveValue) => {
      onItemAppend(itemValue)
      onIndexFocus(value.length)
    },
    [onIndexFocus, onItemAppend, value.length]
  )

  const handlePrepend = useCallback(
    (itemValue: PrimitiveValue) => {
      onItemPrepend(itemValue)
      onIndexFocus(value.length)
    },
    [onIndexFocus, onItemPrepend, value.length]
  )

  const handleSortEnd = useCallback(
    (event: {fromIndex: number; toIndex: number}) => {
      if (value) onMoveItem(event)
      onIndexFocus(event.toIndex)
    },
    [onIndexFocus, onMoveItem, value]
  )

  // Enable transition when the user starts dragging an item
  const handleItemMoveStart = useCallback((event: DragStartEvent) => {
    const {active} = event
    setDisableTransition(false)
    setActiveDragItemIndex(active.data.current?.sortable?.index)
  }, [])

  // Disable transition when the user stops dragging an item.
  // Note: there's an issue with the transition of items when the sorting is completed, so we disable the
  // transition effect when the user stops dragging.
  const handleItemMoveEnd = useCallback(() => {
    setDisableTransition(true)
    setActiveDragItemIndex(null)
  }, [])

  // const focus = useCallback(() => {
  //   if (this._element) {
  //     this._element.focus()
  //   }
  // }, [])

  const renderArrayItem = useCallback(
    (itemProps: Omit<PrimitiveItemProps, 'renderDefault'>) => {
      const sortable = schemaType.options?.sortable !== false
      return <ItemRow {...itemProps} sortable={sortable} insertableTypes={schemaType.of} />
    },
    [schemaType.of, schemaType.options?.sortable]
  )

  const isSortable = !readOnly && schemaType?.options?.sortable !== false

  // Note: we need this in order to generate new id's when items are moved around in the list
  // without it, dndkit will restore focus on the original index of the dragged item
  const membersWithSortIds = useMemo(
    () =>
      members.map((member) => ({
        id: `${member.key}-${member.kind === 'item' ? member.item.value : 'error'}`,
        member: member,
      })),
    [members]
  )

  const documentPanelRef = useBoundaryElement()
  const parentRef = useRef<HTMLDivElement>(null)

  // This keeps the item being dragged in the list so it can be dragged past virtual list
  const rangeExtractor = useCallback(
    (range: Range) => {
      if (activeDragItemIndex !== null) {
        return [...new Set([activeDragItemIndex, ...defaultRangeExtractor(range)])].sort(
          (a, b) => a - b
        )
      }

      return defaultRangeExtractor(range)
    },
    [activeDragItemIndex]
  )

  const observeElementOffset = useCallback<
    VirtualizerOptions<HTMLElement, Element>['observeElementOffset']
  >((instance, cb) => {
    if (!instance.scrollElement) {
      return
    }

    const scroll = instance.scrollElement

    const onScroll = () => {
      const itemOffset = parentRef.current?.offsetTop ?? 0
      cb(scroll.scrollTop - itemOffset)
    }

    onScroll()

    instance.scrollElement.addEventListener('scroll', onScroll, {
      capture: false,
      passive: true,
    })

    // eslint-disable-next-line consistent-return
    return () => {
      scroll.removeEventListener('scroll', onScroll)
    }
  }, [])

  const virtualizer = useVirtualizer({
    count: membersWithSortIds.length,
    estimateSize: useCallback(() => 53, []),
    getScrollElement: useCallback(() => documentPanelRef.element, [documentPanelRef.element]),
    observeElementOffset,
    rangeExtractor,
  })

  const items = virtualizer.getVirtualItems()
  const listGridGap = 1

  return (
    <Stack space={3} ref={parentRef} data-testid="array-primitives-input">
      <UploadTargetCard
        types={schemaType.of}
        resolveUploader={resolveUploader}
        onUpload={onUpload}
        {...elementProps}
        tabIndex={0}
      >
        <Stack space={1}>
          {membersWithSortIds.length === 0 ? (
            <Card padding={3} border style={{borderStyle: 'dashed'}} radius={2}>
              <Text align="center" muted size={1}>
                {schemaType.placeholder || <>No items</>}
              </Text>
            </Card>
          ) : (
            <Card
              padding={1}
              border
              style={{
                // Account for grid gap
                height: `${virtualizer.getTotalSize() + items.length * space[listGridGap]}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              <List
                onItemMove={handleSortEnd}
                onItemMoveStart={handleItemMoveStart}
                onItemMoveEnd={handleItemMoveEnd}
                items={membersWithSortIds.map((m) => m.id)}
                sortable={isSortable}
                gap={listGridGap}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${items[0].start}px)`,
                }}
              >
                {items.map((virtualRow) => {
                  const {member, id} = membersWithSortIds[virtualRow.index]
                  return (
                    <Item
                      ref={virtualizer.measureElement}
                      key={virtualRow.key}
                      id={id}
                      sortable={isSortable}
                      disableTransition={disableTransition}
                      data-index={virtualRow.index}
                    >
                      {member.kind === 'item' && (
                        <ArrayOfPrimitivesItem
                          member={member}
                          renderItem={renderArrayItem}
                          renderInput={renderInput}
                        />
                      )}
                      {member.kind === 'error' && (
                        <ErrorItem
                          sortable={isSortable}
                          member={member}
                          onRemove={() => onItemRemove(virtualRow.index)}
                        />
                      )}
                    </Item>
                  )
                })}
              </List>
            </Card>
          )}
        </Stack>
      </UploadTargetCard>

      <ArrayFunctions
        onChange={onChange}
        onItemAppend={handleAppend}
        onItemPrepend={handlePrepend}
        onValueCreate={getEmptyValue}
        readOnly={readOnly}
        schemaType={schemaType}
        value={value}
      />
    </Stack>
  )
}
