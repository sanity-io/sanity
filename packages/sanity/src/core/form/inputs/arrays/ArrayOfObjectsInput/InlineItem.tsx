import {Box, Button, Menu, MenuButton, MenuItem} from '@sanity/ui'
import React, {useCallback} from 'react'
import {SchemaType} from '@sanity/types'
import {CopyIcon as DuplicateIcon, EllipsisVerticalIcon, TrashIcon} from '@sanity/icons'
import {ObjectItem, ObjectItemProps} from '../../../types'
import {randomKey} from '../common/randomKey'
import {InsertMenu} from './InsertMenu'
import {createProtoArrayValue} from './createProtoArrayValue'
import {RowLayout} from './RowLayout'

interface Props<Item extends ObjectItem> extends Omit<ObjectItemProps<Item>, 'renderDefault'> {
  insertableTypes: SchemaType[]
  sortable?: boolean
  value: Item
}
const MENU_POPOVER_PROPS = {portal: true, tone: 'default'} as const

export function InlineItem<Item extends ObjectItem = ObjectItem>(props: Props<Item>) {
  const {readOnly, onRemove, value, insertableTypes, sortable, onInsert, children} = props

  const handleDuplicate = useCallback(() => {
    onInsert({
      items: [{...value, _key: randomKey()}],
      position: 'after',
    })
  }, [onInsert, value])

  const handleInsert = useCallback(
    (pos: 'before' | 'after', insertType: SchemaType) => {
      onInsert({
        items: [{...createProtoArrayValue(insertType), _key: randomKey()}],
        position: pos,
      })
    },
    [onInsert]
  )

  const menu = !readOnly && (
    <MenuButton
      button={<Button padding={2} mode="bleed" icon={EllipsisVerticalIcon} />}
      id={`${props.inputId}-menuButton`}
      menu={
        <Menu>
          <MenuItem text="Remove" tone="critical" icon={TrashIcon} onClick={onRemove} />
          <MenuItem text="Duplicate" icon={DuplicateIcon} onClick={handleDuplicate} />
          <InsertMenu types={insertableTypes} onInsert={handleInsert} />
        </Menu>
      }
      popover={MENU_POPOVER_PROPS}
    />
  )

  return (
    <Box paddingX={1}>
      <RowLayout dragHandle={sortable} menu={menu}>
        {children}
      </RowLayout>
    </Box>
  )
}
