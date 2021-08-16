import {MenuItem as MenuItemType} from '@sanity/base/__legacy/@sanity/components'
import {ComposeIcon} from '@sanity/icons'
import {Box, Button, Label, Menu, MenuButton, PopoverProps} from '@sanity/ui'
import React from 'react'
import {IntentMenuItem} from './IntentMenuItem'

const POPOVER_PROPS: PopoverProps = {
  constrainSize: true,
  placement: 'bottom',
  portal: true,
}

export function CreateMenuButton(props: {items: MenuItemType[]}) {
  const {items} = props

  return (
    <MenuButton
      button={<Button icon={ComposeIcon} mode="bleed" padding={3} />}
      id="create-menu"
      menu={
        <Menu>
          <Box paddingX={3} paddingTop={3} paddingBottom={2}>
            <Label muted>Create</Label>
          </Box>
          {items.map((createItem, createItemIndex) => (
            <IntentMenuItem intent={createItem.intent!} item={createItem} key={createItemIndex} />
          ))}
        </Menu>
      }
      popover={POPOVER_PROPS}
    />
  )
}
