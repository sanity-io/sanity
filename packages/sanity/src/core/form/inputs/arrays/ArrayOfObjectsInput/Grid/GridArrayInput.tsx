/* eslint-disable react/jsx-handler-names */
import {Card, Stack, Text} from '@sanity/ui'
import {useCallback, useMemo} from 'react'

import {useTranslation} from '../../../../../i18n'
import {ArrayOfObjectsItem} from '../../../../members'
import {
  type ArrayOfObjectsInputProps,
  type ObjectItem,
  type ObjectItemProps,
} from '../../../../types'
import {Item, List} from '../../common/list'
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

  const renderItem = useCallback(({key, ...itemProps}: Omit<ObjectItemProps, 'renderDefault'>) => {
    // todo: consider using a different item component for references
    return <GridItem key={key} {...itemProps} />
  }, [])

  const memberKeys = useMemo(() => members.map((member) => member.key), [members])

  return (
    <Stack space={2}>
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

      <ArrayFunctions
        onChange={onChange}
        onItemAppend={onItemAppend}
        onItemPrepend={onItemPrepend}
        onValueCreate={createProtoArrayValue}
        readOnly={readOnly}
        schemaType={schemaType}
        value={value}
      />
    </Stack>
  )
}
