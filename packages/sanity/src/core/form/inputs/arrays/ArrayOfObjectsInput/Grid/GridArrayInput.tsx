/* eslint-disable react/jsx-handler-names */
import {Card, Stack, Text} from '@sanity/ui'
import React, {useCallback, useMemo} from 'react'
import {Item, List} from '../../common/list'
import {ArrayOfObjectsInputProps, ObjectItem, ObjectItemProps} from '../../../../types'
import {ArrayOfObjectsItem} from '../../../../members'
import {createProtoArrayValue} from '../createProtoArrayValue'
import {UploadTargetCard} from '../../common/UploadTargetCard'
import {ArrayOfObjectsFunctions} from '../ArrayOfObjectsFunctions'
import {GridItem} from './GridItem'
import {ErrorItem} from './ErrorItem'

const EMPTY: [] = []

export function GridArrayInput<Item extends ObjectItem>(props: ArrayOfObjectsInputProps<Item>) {
  const {
    arrayFunctions: ArrayFunctions = ArrayOfObjectsFunctions,
    elementProps,
    members,
    onChange,
    onInsert,
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

  const handlePrepend = useCallback(
    (item: Item) => {
      onInsert({items: [item], position: 'before', referenceItem: 0})
    },
    [onInsert],
  )

  const handleAppend = useCallback(
    (item: Item) => {
      onInsert({items: [item], position: 'after', referenceItem: -1})
    },
    [onInsert],
  )

  const sortable = schemaType.options?.sortable !== false

  const renderItem = useCallback((itemProps: Omit<ObjectItemProps, 'renderDefault'>) => {
    // todo: consider using a different item component for references
    return <GridItem {...itemProps} />
  }, [])

  const memberKeys = useMemo(() => members.map((member) => member.key), [members])

  return (
    <Stack space={3}>
      <UploadTargetCard
        types={schemaType.of}
        resolveUploader={resolveUploader}
        onUpload={onUpload}
        {...elementProps}
        tabIndex={0}
      >
        <Stack data-ui="ArrayInput__content" space={3}>
          {members?.length === 0 && (
            <Card padding={3} border style={{borderStyle: 'dashed'}} radius={2}>
              <Text align="center" muted size={1}>
                {schemaType.placeholder || <>No items</>}
              </Text>
            </Card>
          )}
          {members?.length > 0 && (
            <Card border radius={1}>
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
                    {member.kind === 'error' && <ErrorItem sortable={sortable} member={member} />}
                  </Item>
                ))}
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
