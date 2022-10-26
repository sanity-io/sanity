/* eslint-disable react/jsx-handler-names */
import {Card, Stack, Text} from '@sanity/ui'
import React, {useCallback} from 'react'
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

  const renderItem = useCallback((itemProps: Omit<ObjectItemProps, 'renderDefault'>) => {
    // todo: consider using a different item component for references
    return <GridItem {...itemProps} />
  }, [])

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
                axis="xy"
                lockAxis="xy"
                columns={[2, 3, 4]}
                gap={3}
                padding={1}
                margin={1}
                onItemMove={onItemMove}
                sortable={sortable}
              >
                {members.map((member, index) => (
                  <Item key={member.key} sortable={sortable} index={index} flex={1}>
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
