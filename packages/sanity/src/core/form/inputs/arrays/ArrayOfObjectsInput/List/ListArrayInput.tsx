/* eslint-disable react/jsx-handler-names */
import {Card, Stack, Text} from '@sanity/ui'
import React from 'react'
import {isReferenceSchemaType} from '@sanity/types'
import {UploaderResolver} from '../../../../studio/uploads/types'
import {Item, List} from '../../common/list'
import {ArrayOfObjectsInputProps, ObjectItem, ObjectItemProps, UploadEvent} from '../../../../types'
import {DefaultArrayInputFunctions} from '../../common/ArrayFunctions'
import {ArrayOfObjectsItem} from '../../../../members'

import {createProtoArrayValue} from '../createProtoArrayValue'
import {UploadTargetCard} from '../../common/UploadTargetCard'
import {PreviewItem} from './PreviewItem'
import {ErrorItem} from './ErrorItem'
import {ReferenceItem, ReferenceItemValue} from './ReferenceItem'

export interface ArrayInputProps<Item extends ObjectItem> extends ArrayOfObjectsInputProps<Item> {
  resolveUploader: UploaderResolver
  onUpload: (event: UploadEvent) => void
}

export function ListArrayInput<Item extends ObjectItem>(props: ArrayInputProps<Item>) {
  const {
    schemaType,
    onChange,
    value = [],
    readOnly,
    members,
    elementProps,
    resolveUploader,
    onInsert,
    onItemMove,
    onUpload,
    renderPreview,
    renderField,
    renderInput,
  } = props

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

  const sortable = schemaType.options?.sortable !== false

  const renderItem = (itemProps: Omit<ObjectItemProps, 'renderDefault'>) => {
    return isReferenceSchemaType(itemProps.schemaType) ? (
      <ReferenceItem
        {...itemProps}
        insertableTypes={schemaType.of}
        sortable={sortable}
        schemaType={itemProps.schemaType}
        value={itemProps.value as ReferenceItemValue}
        renderPreview={renderPreview}
      />
    ) : (
      <PreviewItem
        {...itemProps}
        sortable={sortable}
        insertableTypes={schemaType.of}
        preview={renderPreview({
          schemaType: itemProps.schemaType,
          value: itemProps.value,
          layout: 'default',
        })}
      />
    )
  }

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
          {members.length === 0 ? (
            <Card padding={3} border style={{borderStyle: 'dashed'}} radius={2}>
              <Text align="center" muted size={1}>
                {schemaType.placeholder || <>No items</>}
              </Text>
            </Card>
          ) : (
            <Card border radius={1}>
              <List gap={1} paddingY={1} onItemMove={onItemMove} sortable={sortable}>
                {members.map((member, index) => (
                  <Item key={member.key} sortable={sortable} index={index}>
                    {member.kind === 'item' && (
                      <ArrayOfObjectsItem
                        member={member}
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

      <DefaultArrayInputFunctions
        type={schemaType}
        value={value}
        readOnly={readOnly}
        onAppendItem={handleAppend}
        onPrependItem={handlePrepend}
        onCreateValue={createProtoArrayValue}
        onChange={onChange}
      />
    </Stack>
  )
}
