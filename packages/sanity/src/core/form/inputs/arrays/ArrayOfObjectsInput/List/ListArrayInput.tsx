import {Card, Stack, Text, useBoundaryElement, useTheme} from '@sanity/ui'
import {
  defaultRangeExtractor,
  useVirtualizer,
  VirtualizerOptions,
  type Range,
} from '@tanstack/react-virtual'
import React, {useCallback, useMemo, useRef, useState} from 'react'
import type {DragStartEvent} from '@dnd-kit/core'
import {Item, List} from '../../common/list'
import {ArrayOfObjectsInputProps, ObjectItem} from '../../../../types'
import {ArrayOfObjectsItem} from '../../../../members'

import {createProtoArrayValue} from '../createProtoArrayValue'
import {UploadTargetCard} from '../../common/UploadTargetCard'
import {ArrayOfObjectsFunctions} from '../ArrayOfObjectsFunctions'
import {ErrorItem} from './ErrorItem'

const EMPTY: [] = []

export function ListArrayInput<Item extends ObjectItem>(props: ArrayOfObjectsInputProps<Item>) {
  const {
    schemaType,
    onChange,
    value = EMPTY,
    readOnly,
    members,
    elementProps,
    resolveUploader,
    onInsert,
    onItemMove,
    onUpload,
    renderPreview,
    renderField,
    renderItem,
    renderInput,
    arrayFunctions: ArrayFunctions = ArrayOfObjectsFunctions,
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
    count: members.length,
    estimateSize: useCallback(() => 53, []),
    getScrollElement: useCallback(() => documentPanelRef.element, [documentPanelRef.element]),
    observeElementOffset,
    rangeExtractor,
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
  const memberKeys = useMemo(() => members.map((member) => member.key), [members])

  const listGridGap = 1

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
                // Account for grid gap
                height: `${virtualizer.getTotalSize() + items.length * space[listGridGap]}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              <List
                axis="y"
                gap={listGridGap}
                paddingY={1}
                items={memberKeys}
                onItemMove={onItemMove}
                onItemMoveStart={handleItemMoveStart}
                onItemMoveEnd={handleItemMoveEnd}
                sortable={sortable}
                style={{
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
                          renderItem={renderItem}
                          renderField={renderField}
                          renderInput={renderInput}
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
