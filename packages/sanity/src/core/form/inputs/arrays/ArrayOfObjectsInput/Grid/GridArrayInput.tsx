import {Card, Stack, Text} from '@sanity/ui'
import {useCallback, useMemo} from 'react'

import {useTranslation} from '../../../../../i18n'
import {ArrayOfObjectsItem} from '../../../../members'
import {
  type ArrayOfObjectsInputProps,
  type ObjectItem,
  type ObjectItemProps,
} from '../../../../types'
import {UploadTargetCard} from '../../../files/common/uploadTarget/UploadTargetCard'
import {ArrayValidationProvider} from '../../common/ArrayValidationContext'
import {Item, List} from '../../common/list'
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
    onSelectFile,
    onUpload,
    readOnly,
    renderAnnotation,
    renderBlock,
    renderField,
    renderInlineBlock,
    renderInput,
    renderPreview,
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

  return (
    <ArrayValidationProvider schemaType={schemaType} itemCount={members.length}>
      <Stack space={2}>
        <UploadTargetCard
          {...elementProps}
          isReadOnly={readOnly}
          onSelectFile={onSelectFile}
          onUpload={onUpload}
          tabIndex={0}
          types={schemaType.of}
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
          path={props.path}
          readOnly={readOnly}
          schemaType={schemaType}
          value={value}
        />
      </Stack>
    </ArrayValidationProvider>
  )
}
