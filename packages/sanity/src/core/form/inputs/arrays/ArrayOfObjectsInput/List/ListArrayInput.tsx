import {Card, Stack, Text, useTheme} from '@sanity/ui'
import {isKeySegment} from '@sanity/types'
import React, {useCallback, useMemo, useRef, useState} from 'react'
import shallowEquals from 'shallow-equals'
import {
  defaultRangeExtractor,
  useVirtualizer,
  VirtualizerOptions,
  type Range,
  elementScroll,
} from '@tanstack/react-virtual'
import type {DragStartEvent} from '@dnd-kit/core'
import {Item, List} from '../../common/list'
import {ArrayOfObjectsInputProps, ObjectItem} from '../../../../types'
import {ArrayOfObjectsItem} from '../../../../members'

import {createProtoArrayValue} from '../createProtoArrayValue'
import {UploadTargetCard} from '../../common/UploadTargetCard'
import {ArrayOfObjectsFunctions} from '../ArrayOfObjectsFunctions'
import {useVirtualizerScrollInstance} from './useVirtualizerScrollInstance'
import {ErrorItem} from './ErrorItem'
import {useMemoCompare} from './useMemoCompare'

const EMPTY: [] = []

export function ListArrayInput<Item extends ObjectItem>(props: ArrayOfObjectsInputProps<Item>) {
  const {
    arrayFunctions: ArrayFunctions = ArrayOfObjectsFunctions,
    elementProps,
    members,
    onChange,
    onInsert,
    onItemMove,
    onUpload,
    focusPath,
    readOnly,
    renderAnnotation,
    renderBlock,
    renderField,
    renderInlineBlock,
    renderInput,
    renderItem,
    renderPreview,
    resolveUploader,
    schemaType,
    value = EMPTY,
  } = props

  // Stores the index of the item being dragged
  const [activeDragItemIndex, setActiveDragItemIndex] = useState<number | null>(null)
  const {space} = useTheme().sanity

  const handlePrepend = useCallback(
    (item: Item) => {
      onInsert({items: [item], position: 'before', referenceItem: 0})
    },
    [onInsert]
  )

  const handleAppend = useCallback(
    (item: Item) => {
      onInsert({items: [item], position: 'after', referenceItem: -1})
    },
    [onInsert]
  )

  const memberKeys = useMemoCompare(
    useMemo(() => members.map((member) => member.key), [members]),
    shallowEquals
  )

  const {scrollElement, containerElement} = useVirtualizerScrollInstance()
  const parentRef = useRef<HTMLDivElement>(null)

  const focusPathKey = useMemo(() => {
    return isKeySegment(focusPath[0]) ? focusPath[0]._key : focusPath[0]
  }, [focusPath])

  /**
   * This is a custom range extractor that adds the activeDragItemIndex and focusedItem to the range
   * so that the item is always rendered and it can perform it's own actions
   * Note: When adding an index make sure the range includes all index or the scroll will jump
   */
  const rangeExtractor = useCallback(
    (range: Range) => {
      const newRange = {...range}

      // Update start and end indexes based on activeDragItemIndex
      if (activeDragItemIndex !== null) {
        newRange.startIndex = Math.min(range.startIndex, activeDragItemIndex)
        newRange.endIndex = Math.max(range.endIndex, activeDragItemIndex)
      }

      // Update start and end indexes based on focusPathKey
      if (focusPathKey) {
        const index = memberKeys.findIndex((key) => key === focusPathKey)
        if (index !== -1) {
          newRange.startIndex = Math.min(newRange.startIndex, index)
          newRange.endIndex = Math.max(newRange.endIndex, index)
        }
      }

      return defaultRangeExtractor(newRange)
    },
    [activeDragItemIndex, focusPathKey, memberKeys]
  )

  /**
   * It observes the scroll element and calls the callback function with the difference between the
   * scroll's scrollTop and the offsetTop of the parent element of the observed element.
   * it return an unsubscribe function that removes the event listener when called.
   */
  const observeElementOffset = useCallback<
    VirtualizerOptions<HTMLElement, Element>['observeElementOffset']
  >(
    (instance, cb) => {
      if (!instance.scrollElement) {
        return undefined
      }

      const scroll = instance.scrollElement

      const handleScroll = () => {
        const containerElementTop = containerElement.current?.getBoundingClientRect().top ?? 0
        const parentElementTop = parentRef.current?.getBoundingClientRect().top ?? 0

        const itemOffset = Math.floor(parentElementTop - containerElementTop)

        cb(scroll.scrollTop - itemOffset)
      }

      handleScroll()

      instance.scrollElement.addEventListener('scroll', handleScroll, {
        capture: false,
        passive: true,
      })

      return () => {
        scroll.removeEventListener('scroll', handleScroll)
      }
    },
    [containerElement]
  )

  // This is the estimated size of an item in the list. The reason this is an estimate is because
  // custom components can have different dimensions and the library recalculate the size of the element
  const estimateSize = useCallback(() => 53, [])

  const virtualizer = useVirtualizer({
    count: members.length,
    estimateSize,
    getScrollElement: useCallback(() => scrollElement, [scrollElement]),
    observeElementOffset,
    rangeExtractor,
    getItemKey: useCallback((index: number) => memberKeys[index], [memberKeys]),
    scrollToFn: (offset, options, instance) => {
      // If the offset is the same as the current scroll offset, don't scroll
      // Offset gets set to 0 here https://github.com/TanStack/virtual/blob/beta/packages/virtual-core/src/index.ts#L211
      // which causes the scroll to top
      if (offset === instance.scrollOffset) {
        return
      }
      elementScroll(offset, options, instance)
    },
  })

  const items = virtualizer.getVirtualItems()

  const handleItemMoveStart = useCallback((event: DragStartEvent) => {
    const {active} = event
    setActiveDragItemIndex(active.data.current?.sortable?.index)
  }, [])

  const handleItemMoveEnd = useCallback(() => {
    setActiveDragItemIndex(null)
  }, [])

  const sortable = schemaType.options?.sortable !== false

  const listGridGap = 1
  const paddingY = 1

  return (
    <Stack space={3} ref={parentRef}>
      <UploadTargetCard
        types={schemaType.of}
        resolveUploader={resolveUploader}
        onUpload={onUpload}
        {...elementProps}
        tabIndex={0}
      >
        <Stack data-ui="ArrayInput__content" space={3}>
          {members.length === 0 ? (
            <Card padding={3} border style={{borderStyle: 'dashed'}} radius={2}>
              <Text align="center" muted size={1}>
                {schemaType.placeholder || <>No items</>}
              </Text>
            </Card>
          ) : (
            <Card
              border
              radius={1}
              style={{
                // This is not memoized since it changes on scroll so it will change anyways making memo useless
                // Account for grid gap
                height: `${
                  virtualizer.getTotalSize() + items.length * space[listGridGap] + space[paddingY]
                }px`,
                width: '100%',
                position: 'relative',
              }}
            >
              <List
                axis="y"
                gap={listGridGap}
                paddingY={paddingY}
                items={memberKeys}
                onItemMove={onItemMove}
                onItemMoveStart={handleItemMoveStart}
                onItemMoveEnd={handleItemMoveEnd}
                sortable={sortable}
                style={{
                  // This is not memoized since it changes on scroll so it will change anyways making memo useless
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${items[0].start}px)`,
                }}
              >
                {items.map((virtualRow) => {
                  const member = members[virtualRow.index]
                  return (
                    <Item
                      ref={virtualizer.measureElement}
                      key={virtualRow.key}
                      sortable={sortable}
                      data-index={virtualRow.index}
                      id={member.key}
                    >
                      {member.kind === 'item' && (
                        <ArrayOfObjectsItem
                          member={member}
                          renderAnnotation={renderAnnotation}
                          renderBlock={renderBlock}
                          renderField={renderField}
                          renderInlineBlock={renderInlineBlock}
                          renderInput={renderInput}
                          renderItem={renderItem}
                          renderPreview={renderPreview}
                        />
                      )}
                      {member.kind === 'error' && (
                        <ErrorItem
                          sortable={sortable}
                          member={member}
                          onRemove={() => props.onItemRemove(member.key)}
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
        onValueCreate={createProtoArrayValue}
        readOnly={readOnly}
        schemaType={schemaType}
        value={value}
      />
    </Stack>
  )
}
