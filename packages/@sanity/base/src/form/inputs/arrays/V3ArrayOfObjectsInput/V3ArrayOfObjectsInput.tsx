import React, {useCallback} from 'react'
import {ArrayOfObjectsInputProps} from '../../../types'
import {Button, Card, Flex, Inline, Stack, Text} from '@sanity/ui'
import {Item, List} from '../common/list'
import {ItemMember} from '../ArrayOfObjectsInput/ItemMember'
import {DefaultArrayInputFunctions} from '../common/ArrayFunctions'
import {createProtoValue} from '../../../utils/createProtoValue'
import {DragHandle} from '../common/DragHandle'
import {CollapseIcon, ExpandIcon} from '@sanity/icons'

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
    onMoveItem,
    renderItem: defaultRenderItem,
    renderField,
    renderInput,
  } = props

  const options = schemaType.options || {}
  const hasMissingKeys = value.some((item) => !item._key)
  const isSortable = options.sortable !== false && !hasMissingKeys
  const isGrid = options.layout === 'grid'
  const handleSortEnd = useCallback(
    (event: {newIndex: number; oldIndex: number}) => {
      onMoveItem({fromIndex: event.oldIndex, toIndex: event.newIndex})
    },
    [onMoveItem]
  )

  const handleFocusItem = useCallback(
    (itemKey: string) => {
      onFocusChildPath([{_key: itemKey}])
    },
    [onFocusChildPath]
  )

  const renderItem = useCallback((item) => {
    const collapsed = item.collapsed !== false
    return (
      <Card radius={2} padding={2} border>
        <Flex gap={2}>
          <Button
            mode="bleed"
            onClick={() => item.onSetCollapsed(!collapsed)}
            text={collapsed ? 'Expand' : 'Collapse'}
            icon={collapsed ? CollapseIcon : ExpandIcon}
          />
          {collapsed ? (
            <Card flex={1} shadow={1} radius={2} padding={2}>
              <Text size={1}>Preview: {JSON.stringify(item.value)}</Text>
            </Card>
          ) : (
            item.children
          )}
        </Flex>
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
