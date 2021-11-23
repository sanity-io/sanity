import {ComposeIcon} from '@sanity/icons'
import {Box, Button, Label, Menu, MenuButton, PopoverProps} from '@sanity/ui'
import React from 'react'
import {PaneMenuItem} from '../../types'
import {IntentMenuItem} from '../../components/IntentMenuItem'

const POPOVER_PROPS: PopoverProps = {
  constrainSize: true,
  placement: 'bottom',
  portal: true,
}

export function CreateMenuButton(props: {
  permissions: {granted: boolean; reason: string}[]
  items: PaneMenuItem[]
}) {
  const {items, permissions} = props

  return (
    <MenuButton
      button={
        <Button
          data-testid="multi-action-intent-button"
          icon={ComposeIcon}
          mode="bleed"
          padding={3}
        />
      }
      id="create-menu"
      menu={
        <Menu>
          <Box paddingX={3} paddingTop={3} paddingBottom={2}>
            <Label muted>Create</Label>
          </Box>
          {items.map((createItem, createItemIndex) => (
            <IntentMenuItem
              data-testid={`action-intent-button-${createItemIndex}`}
              disabled={!permissions[createItemIndex]?.granted}
              icon={createItem.icon}
              intent={createItem.intent!}
              key={createItemIndex}
              text={createItem.title}
              title={
                permissions[createItemIndex]?.granted
                  ? undefined
                  : permissions[createItemIndex]?.reason
              }
            />
          ))}
        </Menu>
      }
      popover={POPOVER_PROPS}
    />
  )
}
