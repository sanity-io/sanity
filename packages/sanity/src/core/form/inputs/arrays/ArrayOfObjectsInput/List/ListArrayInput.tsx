/* eslint-disable react/jsx-handler-names */
import {Card, Stack, Text} from '@sanity/ui'
import React, {useCallback, useMemo} from 'react'
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
          {members.length === 0 ? (
            <Card padding={3} border style={{borderStyle: 'dashed'}} radius={2}>
              <Text align="center" muted size={1}>
                {schemaType.placeholder || <>No items</>}
              </Text>
            </Card>
          ) : (
            <Card border radius={1}>
              <List
                axis="y"
                gap={1}
                paddingY={1}
                items={memberKeys}
                onItemMove={onItemMove}
                sortable={sortable}
              >
                {members.map((member) => (
                  <Item key={member.key} sortable={sortable} id={member.key}>
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
