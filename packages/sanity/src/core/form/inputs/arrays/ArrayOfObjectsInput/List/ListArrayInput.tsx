import {type DragStartEvent} from '@dnd-kit/core'
import {isFileSchemaType, isImageSchemaType, isKeySegment, type KeyedSegment} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import * as PathUtils from '@sanity/util/paths'
import {useCallback, useMemo, useRef, useState} from 'react'
import shallowEquals from 'shallow-equals'

import {useTranslation} from '../../../../../i18n'
import {useChildValidation} from '../../../../studio/contexts/Validation'
import {type ArrayOfObjectsInputProps, type ObjectItem} from '../../../../types'
import {SelectionToolbar} from '../../common/SelectionToolbar'
import {UploadTargetCard} from '../../common/UploadTargetCard'
import {ArrayOfObjectsFunctions} from '../ArrayOfObjectsFunctions'
import {createProtoArrayValue} from '../createProtoArrayValue'
import {useMemoCompare} from './useMemoCompare'
import {useVisibilityDetection} from './useVisibilityDetection'
import {VirtualizedArrayList} from './VirtualizedArrayList'

const EMPTY: [] = []

export function ListArrayInput<Item extends ObjectItem>(props: ArrayOfObjectsInputProps<Item>) {
  const {
    arrayFunctions: ArrayFunctions = ArrayOfObjectsFunctions,
    elementProps,
    members,
    onChange,
    id,
    onInsert,
    selectedItemKeys,
    onSelectEnd,
    selectActive,
    onSelectBegin,
    onSelectNone,
    onSelectAll,
    onItemSelect,
    onItemUnselect,
    onSelectedItemsRemove,
    onItemMove,
    onUpload,
    focusPath,
    readOnly,
    onItemAppend,
    onItemPrepend,
    renderAnnotation,
    renderBlock,
    renderField,
    renderInlineBlock,
    renderInput,
    renderItem,
    renderPreview,
    resolveUploader,
    schemaType,
    path,
    value = EMPTY,
  } = props
  const {t} = useTranslation()

  const childValidation = useChildValidation(path)
  // Stores the index of the item being dragged
  const [activeDragItemIndex, setActiveDragItemIndex] = useState<number | null>(null)

  const acceptsImagesOrFiles = useMemo(() => {
    return schemaType.of.some(
      (itemType) => isImageSchemaType(itemType) || isFileSchemaType(itemType),
    )
  }, [schemaType])

  const memberKeys = useMemoCompare(
    useMemo(() => members.map((member) => member.key), [members]),
    shallowEquals,
  )

  const parentRef = useRef<HTMLDivElement>(null)
  // Detect visibility changes to remount virtualizer when becoming visible
  const {isVisible, mountKey} = useVisibilityDetection(parentRef)

  const focusPathKey = useMemo(() => {
    const segment = focusPath[0]
    if (isKeySegment(segment)) {
      return segment._key
    }
    if (typeof segment === 'number') {
      return segment
    }
    return undefined
  }, [focusPath])

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
  const radius = 2

  const invalidItemKeys = childValidation.flatMap(
    (validationItem) =>
      (validationItem.level === 'error' &&
        (PathUtils.trimLeft(path, validationItem.path)[0] as KeyedSegment)?._key) ||
      [],
  )

  return (
    <Stack space={2} ref={parentRef}>
      <Card border radius={2}>
        <Stack space={1}>
          <SelectionToolbar
            path={path}
            readOnly={readOnly}
            id={`${id}-selectionToolbar`}
            selectedItemKeys={selectedItemKeys}
            invalidItemKeys={invalidItemKeys}
            allKeys={memberKeys}
            selectActive={selectActive}
            canUpload={acceptsImagesOrFiles}
            onSelectedItemsRemove={onSelectedItemsRemove}
            onSelectEnd={onSelectEnd}
            onSelectBegin={onSelectBegin}
            onItemSelect={onItemSelect}
            onItemUnselect={onItemUnselect}
          >
            <ArrayFunctions
              onChange={onChange}
              onItemAppend={onItemAppend}
              onItemPrepend={onItemPrepend}
              onValueCreate={createProtoArrayValue}
              path={props.path}
              readOnly={readOnly}
              schemaType={schemaType}
              value={value}
            />
          </SelectionToolbar>
          <UploadTargetCard
            $radius={radius}
            types={schemaType.of}
            resolveUploader={resolveUploader}
            onUpload={onUpload}
            {...elementProps}
            tabIndex={0}
          >
            <Stack data-ui="ArrayInput__content" space={2}>
              {members.length === 0 ? (
                <Card padding={3} border radius={2}>
                  <Text align="center" muted size={1}>
                    {schemaType.placeholder || <>{t('inputs.array.no-items-label')}</>}
                  </Text>
                </Card>
              ) : isVisible ? (
                <VirtualizedArrayList
                  key={mountKey}
                  members={members}
                  memberKeys={memberKeys}
                  activeDragItemIndex={activeDragItemIndex}
                  focusPathKey={focusPathKey}
                  onItemMove={onItemMove}
                  onItemMoveStart={handleItemMoveStart}
                  onItemMoveEnd={handleItemMoveEnd}
                  sortable={sortable}
                  readOnly={readOnly}
                  onItemRemove={(key) => props.onItemRemove(key)}
                  renderAnnotation={renderAnnotation}
                  renderBlock={renderBlock}
                  renderField={renderField}
                  renderInlineBlock={renderInlineBlock}
                  renderInput={renderInput}
                  renderItem={renderItem}
                  renderPreview={renderPreview}
                  listGridGap={listGridGap}
                  paddingY={paddingY}
                  radius={radius}
                />
              ) : null}
            </Stack>
          </UploadTargetCard>
        </Stack>
      </Card>
    </Stack>
  )
}
