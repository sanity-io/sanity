/* eslint-disable react/jsx-handler-names */
import {Card, Stack, Text} from '@sanity/ui'
import React from 'react'
import {ArraySortableItem, ArraySortableList} from '../../common/arraySortableList'
import {ArrayOfObjectsInputProps, ObjectItem} from '../../../../types'
import {DefaultArrayInputFunctions} from '../../common/ArrayFunctions'
import {ArrayOfObjectsItem} from '../../../../members'

import {createProtoArrayValue} from '../createProtoArrayValue'
import {UploadTargetCard} from '../../common/UploadTargetCard'
import {useArrayFunctionHandlers} from '../useArrayFunctionHandlers'
import {ListErrorItem} from './ListErrorItem'

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
    onItemMove,
    onUpload,
    renderPreview,
    renderField,
    renderItem,
    renderInput,
  } = props

  const {handlePrepend, handleAppend} = useArrayFunctionHandlers(props)

  const sortable = schemaType.options?.sortable !== false

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
          {members?.length === 0 ? (
            <Card padding={3} border style={{borderStyle: 'dashed'}} radius={2}>
              <Text align="center" muted size={1}>
                {schemaType.placeholder || <>No items</>}
              </Text>
            </Card>
          ) : (
            <Card border radius={1}>
              <ArraySortableList gap={1} paddingY={1} onItemMove={onItemMove} sortable={sortable}>
                {members.map((member, index) => (
                  <ArraySortableItem key={member.key} sortable={sortable} index={index}>
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
                      <ListErrorItem sortable={sortable} member={member} />
                    )}
                  </ArraySortableItem>
                ))}
              </ArraySortableList>
            </Card>
          )}
        </Stack>
      </UploadTargetCard>

      <DefaultArrayInputFunctions
        type={schemaType}
        value={value}
        readOnly={readOnly}
        onItemAppend={handleAppend}
        onItemPrepend={handlePrepend}
        onValueCreate={createProtoArrayValue}
        onChange={onChange}
      />
    </Stack>
  )
}
