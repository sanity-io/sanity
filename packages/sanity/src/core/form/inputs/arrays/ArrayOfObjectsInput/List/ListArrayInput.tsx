import {type DragStartEvent} from '@dnd-kit/core'
import {isKeySegment} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import {useCallback, useMemo, useRef, useState} from 'react'
import shallowEquals from 'shallow-equals'

import {useTranslation} from '../../../../../i18n'
import {type ArrayOfObjectsInputProps, type ObjectItem} from '../../../../types'
import {UploadTargetCard} from '../../../files/common/uploadTarget/UploadTargetCard'
import {ArrayValidationProvider} from '../../common/ArrayValidationContext'
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
    onItemMove,
    onSelectFile,
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
    schemaType,
    value = EMPTY,
  } = props
  const {t} = useTranslation()

  // Stores the index of the item being dragged
  const [activeDragItemIndex, setActiveDragItemIndex] = useState<number | null>(null)

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

  return (
    <ArrayValidationProvider schemaType={schemaType} itemCount={members.length}>
      <Stack space={2} ref={parentRef}>
        <UploadTargetCard
          {...elementProps}
          $radius={radius}
          isReadOnly={readOnly}
          onSelectFile={onSelectFile}
          onUpload={onUpload}
          tabIndex={0}
          types={schemaType.of}
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
      </Stack>
    </ArrayValidationProvider>
  )
}
