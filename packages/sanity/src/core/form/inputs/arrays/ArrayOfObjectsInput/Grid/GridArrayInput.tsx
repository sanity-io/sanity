import {isFileSchemaType, isImageSchemaType, type KeyedSegment} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import * as PathUtils from '@sanity/util/paths'
import {useCallback, useMemo} from 'react'

import {useTranslation} from '../../../../../i18n'
import {ArrayOfObjectsItem} from '../../../../members'
import {useChildValidation} from '../../../../studio/contexts/Validation'
import {
  type ArrayOfObjectsInputProps,
  type ObjectItem,
  type ObjectItemProps,
} from '../../../../types'
import {Item, List} from '../../common/list'
import {SelectionToolbar} from '../../common/SelectionToolbar'
import {UploadTargetCard} from '../../common/UploadTargetCard'
import {ArrayOfObjectsFunctions} from '../ArrayOfObjectsFunctions'
import {createProtoArrayValue} from '../createProtoArrayValue'
import {ErrorItem} from './ErrorItem'
import {GridItem} from './GridItem'

const EMPTY: [] = []

export function GridArrayInput<Item extends ObjectItem>(props: ArrayOfObjectsInputProps<Item>) {
  const {
    arrayFunctions: ArrayFunctions = ArrayOfObjectsFunctions,
    elementProps,
    members,
    path,
    id,
    selectedItemKeys,
    onSelectedItemsRemove,
    selectActive,
    onSelectEnd,
    onItemUnselect,
    onItemSelect,
    onSelectBegin,
    onChange,
    onItemPrepend,
    onItemAppend,
    onItemMove,
    onUpload,
    readOnly,
    renderAnnotation,
    renderBlock,
    renderField,
    renderInlineBlock,
    renderInput,
    renderPreview,
    resolveUploader,
    schemaType,
    value = EMPTY,
  } = props
  const {t} = useTranslation()

  const sortable = schemaType.options?.sortable !== false

  const renderItem = useCallback((itemProps: Omit<ObjectItemProps, 'renderDefault'>) => {
    // todo: consider using a different item component for references
    return <GridItem {...itemProps} />
  }, [])

  const memberKeys = useMemo(() => members.map((member) => member.key), [members])
  const childValidation = useChildValidation(path)

  const invalidItemKeys = childValidation.flatMap(
    (validationItem) =>
      (validationItem.level === 'error' &&
        (PathUtils.trimLeft(path, validationItem.path)[0] as KeyedSegment)?._key) ||
      [],
  )
  const acceptsImagesOrFiles = useMemo(() => {
    return schemaType.of.some(
      (itemType) => isImageSchemaType(itemType) || isFileSchemaType(itemType),
    )
  }, [schemaType])

  return (
    <Stack space={2}>
      <Card border radius={1}>
        <Stack space={1}>
          <SelectionToolbar
            path={path}
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
              path={path}
              onValueCreate={createProtoArrayValue}
              readOnly={readOnly}
              schemaType={schemaType}
              value={value}
            />
          </SelectionToolbar>
          <UploadTargetCard
            types={schemaType.of}
            resolveUploader={resolveUploader}
            onUpload={onUpload}
            {...elementProps}
            tabIndex={0}
          >
            <Stack data-ui="ArrayInput__content" space={2}>
              {members?.length === 0 && (
                <Card padding={3} border radius={2}>
                  <Text align="center" muted size={1}>
                    {schemaType.placeholder || <>{t('inputs.array.no-items-label')}</>}
                  </Text>
                </Card>
              )}
              {members?.length > 0 && (
                <Card>
                  <List
                    columns={[2, 3, 4]}
                    gap={3}
                    padding={1}
                    margin={1}
                    items={memberKeys}
                    onItemMove={onItemMove}
                    sortable={sortable}
                  >
                    {members.map((member) => (
                      <Item key={member.key} sortable={sortable} id={member.key} flex={1}>
                        {member.kind === 'item' && (
                          <ArrayOfObjectsItem
                            member={member}
                            renderAnnotation={renderAnnotation}
                            renderBlock={renderBlock}
                            renderInlineBlock={renderInlineBlock}
                            renderItem={renderItem}
                            renderField={renderField}
                            renderInput={renderInput}
                            renderPreview={renderPreview}
                          />
                        )}
                        {member.kind === 'error' && (
                          <ErrorItem sortable={sortable} member={member} readOnly={readOnly} />
                        )}
                      </Item>
                    ))}
                  </List>
                </Card>
              )}
            </Stack>
          </UploadTargetCard>
        </Stack>
      </Card>
    </Stack>
  )
}
