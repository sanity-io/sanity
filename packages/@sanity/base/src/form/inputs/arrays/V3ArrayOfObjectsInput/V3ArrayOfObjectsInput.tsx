import React, {useCallback} from 'react'
import {ArrayOfObjectsInputProps} from '../../../types'
import {isPlainObject} from 'lodash'
import {FormFieldSet} from '../../../components/formField'
import {Alert} from '../../../components/Alert'
import {Box, Button, Card, Flex, Inline, Spinner, Stack, Text} from '@sanity/ui'
import {Details} from '../../../components/Details'
import {isDev} from '../../../../environment'
import {EMPTY_ARRAY} from '../../../utils/empty'
import {ImperativeToast} from '../../../../components/transitional'
import {Item, List} from '../common/list'
import {ItemMember} from '../ArrayOfObjectsInput/ItemMember'
import {DefaultArrayInputFunctions} from '../common/ArrayFunctions'
import {createProtoValue} from '../../../utils/createProtoValue'
import {DragHandle} from '../common/DragHandle'

export function V3ArrayOfObjectsInput(props: ArrayOfObjectsInputProps) {
  const {
    level = 1,
    validation,
    members,
    readOnly,
    value = [],
    schemaType,
    onChange,
    onFocusChildPath,
    onAppendItem,
    onPrependItem,
    renderItem: defaultRenderItem,
    renderField,
    renderInput,
  } = props

  const options = schemaType.options || {}
  const hasMissingKeys = value.some((item) => !item._key)
  const isSortable = options.sortable !== false && !hasMissingKeys
  const isGrid = options.layout === 'grid'
  const handleSortEnd = useCallback(() => {
    console.log('handle sort end')
  }, [])

  const handleFocusItem = useCallback(
    (itemKey: string) => {
      onFocusChildPath([{_key: itemKey}])
    },
    [onFocusChildPath]
  )

  const renderItem = useCallback((item) => {
    const collapsed = item.collapsed !== false
    return (
      <Card radius={2} padding={2}>
        <Button
          onClick={() => item.onSetCollapsed(!collapsed)}
          text={collapsed ? 'Expand' : 'Collapse'}
        />
        {collapsed ? (
          <Card shadow={1} radius={2}>
            Preview: {JSON.stringify(item.value)}
          </Card>
        ) : (
          item.children
        )}
      </Card>
    )
  }, [])

  return (
    <Stack space={3}>
      <Stack data-ui="ArrayInput__content" space={3}>
        {members?.length > 0 && (
          <Card border radius={1} paddingY={isGrid ? 2 : 1} paddingX={isGrid ? 2 : undefined}>
            <List onSortEnd={handleSortEnd} isSortable={isSortable} isGrid={isGrid}>
              {members.map((member, index) => {
                return (
                  <Item key={member.key} isSortable={isSortable} isGrid={isGrid} index={index}>
                    <Flex gap={2}>
                      <DragHandle />
                      <ItemMember
                        member={member}
                        renderItem={renderItem}
                        renderField={renderField}
                        renderInput={renderInput}
                      />
                    </Flex>
                  </Item>
                )
              })}
            </List>
          </Card>
        )}
      </Stack>
      {/*todo make configurable*/}
      <DefaultArrayInputFunctions
        type={schemaType}
        value={value}
        readOnly={readOnly}
        onAppendItem={onAppendItem}
        onPrependItem={onPrependItem}
        onFocusItem={handleFocusItem}
        onCreateValue={createProtoValue}
        onChange={onChange}
      />
    </Stack>
  )
}
