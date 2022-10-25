/* eslint-disable react/no-unused-prop-types */
import {Button, Menu, MenuButton, MenuItem} from '@sanity/ui'
import {CopyIcon as DuplicateIcon, EllipsisVerticalIcon, TrashIcon} from '@sanity/icons'
import React from 'react'
import {ArraySchemaType, SchemaType} from '@sanity/types'
import {ObjectItem, ObjectItemProps} from '../../../../types'
import {ArrayItemInsertMenu} from './ArrayItemInsertMenu'

const MENU_POPOVER_PROPS = {portal: true, tone: 'default'} as const

export interface ArrayItemMenuButtonProps {
  inputId: string
  insertableTypes: ArraySchemaType['of']
  onRemove: ObjectItemProps['onRemove']
  handleDuplicate: () => void
  handleInsert: (pos: 'before' | 'after', insertType: SchemaType) => void
}

export function ArrayItemMenuButton<Item extends ObjectItem = ObjectItem>(
  props: ArrayItemMenuButtonProps
) {
  const {insertableTypes, onRemove, handleDuplicate, handleInsert} = props
  return (
    <MenuButton
      button={<Button padding={2} mode="bleed" icon={EllipsisVerticalIcon} />}
      id={`${props.inputId}-menuButton`}
      menu={
        <Menu>
          <MenuItem text="Remove" tone="critical" icon={TrashIcon} onClick={onRemove} />
          <MenuItem text="Duplicate" icon={DuplicateIcon} onClick={handleDuplicate} />
          <ArrayItemInsertMenu types={insertableTypes} onInsert={handleInsert} />
        </Menu>
      }
      popover={MENU_POPOVER_PROPS}
    />
  )
}
