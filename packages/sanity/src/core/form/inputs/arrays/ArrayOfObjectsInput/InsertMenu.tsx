/* eslint-disable react/jsx-no-bind */
import {SchemaType} from '@sanity/types'
import React, {ComponentProps, memo} from 'react'
import {MenuGroup, MenuItem, PopoverProps} from '@sanity/ui'
import {InsertAboveIcon, InsertBelowIcon} from '@sanity/icons'

interface Props {
  types?: SchemaType[]
  onInsert: (pos: 'before' | 'after', type: SchemaType) => void
}

const MENU_POPOVER_PROPS: PopoverProps = {
  portal: true,
  tone: 'default',
  placement: 'left',
  constrainSize: true,
} as const

export const InsertMenu = memo(function InsertMenu(props: Props) {
  const {types, onInsert} = props
  return (
    <>
      <InsertMenuGroup
        pos="before"
        types={types}
        onInsert={onInsert}
        text="Add item before"
        icon={InsertAboveIcon}
      />
      <InsertMenuGroup
        pos="after"
        types={types}
        onInsert={onInsert}
        text="Add item after"
        icon={InsertBelowIcon}
      />
    </>
  )
})

function InsertMenuGroup(
  props: Props & {
    pos: 'before' | 'after'
    text: ComponentProps<typeof MenuItem>['text']
    icon: ComponentProps<typeof MenuItem>['icon']
  },
) {
  const {types, onInsert, pos, text, icon} = props

  if (types?.length === 1) {
    return <MenuItem key={pos} text={text} icon={icon} onClick={() => onInsert(pos, types[0])} />
  }
  return (
    <MenuGroup text={text} key={pos} popover={MENU_POPOVER_PROPS}>
      {types?.map((insertableType) => (
        <MenuItem
          key={insertableType.name}
          icon={insertableType.icon}
          text={insertableType.title}
          onClick={() => onInsert(pos, insertableType)}
        />
      ))}
    </MenuGroup>
  )
}
