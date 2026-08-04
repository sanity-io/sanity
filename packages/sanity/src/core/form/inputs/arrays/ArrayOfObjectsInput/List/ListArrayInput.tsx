import {type DragStartEvent} from '@dnd-kit/core'
import {Card, type CardTone, Stack, Text} from '@sanity/ui'
import {useCallback, useMemo, useRef, useState} from 'react'
import shallowEquals from 'shallow-equals'

import {useTranslation} from '../../../../../i18n/hooks/useTranslation'
import {useItemComponent} from '../../../../form-components-hooks/componentHooks'
import {type ArrayOfObjectsInputProps} from '../../../../types/inputProps'
import {type ObjectItem, type ObjectItemProps} from '../../../../types/itemProps'
import {UploadTargetCard} from '../../../files/common/uploadTarget/UploadTargetCard'
import {ArrayItemsToggle} from '../../common/ArrayItemsToggle'
import {ArrayValidationProvider} from '../../common/ArrayValidationContext'
import {getFocusedMemberKey, useCollapsibleArrayItems} from '../../common/useCollapsibleArrayItems'
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
    renderPreview,
    schemaType,
    validation,
    value = EMPTY,
  } = props
  const {t} = useTranslation()

  // Resolves locally to avoid the deep nesting preview bug (#4780) caused by
  // props.renderItem accumulating callback wrapping through ancestor components.
  const ItemComponent = useItemComponent()
  const renderItem = useCallback(
    (itemProps: Omit<ObjectItemProps, 'renderDefault'>) => <ItemComponent {...itemProps} />,
    [ItemComponent],
  )
  const hasErrors = validation?.some((v) => v.level === 'error')
  const errorTone: CardTone | undefined = hasErrors ? 'critical' : undefined

  // Stores the index of the item being dragged
  const [activeDragItemIndex, setActiveDragItemIndex] = useState<number | null>(null)

  const parentRef = useRef<HTMLDivElement>(null)
  // Detect visibility changes to remount virtualizer when becoming visible
  const {isVisible, mountKey} = useVisibilityDetection(parentRef)

  const focusPathKey = useMemo(() => getFocusedMemberKey(focusPath), [focusPath])

  const {collapsible, expanded, onToggle, visibleMembers} = useCollapsibleArrayItems({
    members,
    schemaType,
    layout: 'list',
    focusedKey: focusPathKey,
  })

  const memberKeys = useMemoCompare(
    useMemo(() => visibleMembers.map((member) => member.key), [visibleMembers]),
    shallowEquals,
  )

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
      <Stack gap={2} ref={parentRef}>
        <UploadTargetCard
          {...elementProps}
          $radius={radius}
          isReadOnly={readOnly}
          onSelectFile={onSelectFile}
          onUpload={onUpload}
          tabIndex={0}
          types={schemaType.of}
        >
          <Stack data-ui="ArrayInput__content" gap={2}>
            {members.length === 0 ? (
              <Card padding={3} border radius={2} tone={errorTone}>
                <Text align="center" muted size={1}>
                  {/* oxlint-disable-next-line no-deprecated -- will fix in follow up PR */}
                  {schemaType.placeholder || <>{t('inputs.array.no-items-label')}</>}
                </Text>
              </Card>
            ) : isVisible ? (
              <VirtualizedArrayList
                key={mountKey}
                members={visibleMembers}
                fadeBottom={collapsible && !expanded}
                tone={errorTone}
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
            {collapsible && (
              <ArrayItemsToggle
                expanded={expanded}
                onToggle={onToggle}
                totalCount={members.length}
              />
            )}
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
