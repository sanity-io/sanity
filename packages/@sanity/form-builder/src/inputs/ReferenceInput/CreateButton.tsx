/* eslint-disable complexity */
/* eslint-disable max-nested-callbacks,no-nested-ternary */
import React, {ComponentProps} from 'react'
import {AddIcon} from '@sanity/icons'
import {Box, Button, Menu, MenuButton, MenuItem, Text, Tooltip} from '@sanity/ui'
import {InsufficientPermissionsMessage} from '@sanity/base/components'
import {CreateOption} from './types'

interface Props extends ComponentProps<typeof Button> {
  id: string
  createOptions: CreateOption[]
  onCreate: (option: CreateOption) => void
}

function ConditionalTooltip(props: ComponentProps<typeof Tooltip> & {enabled: boolean}) {
  const {enabled, ...rest} = props
  return enabled ? <Tooltip {...rest} /> : props.children
}

export function CreateButton(props: Props) {
  const {createOptions, onCreate, id, ...rest} = props

  const canCreateAny = createOptions.some((option) => option.permission.granted)
  if (!canCreateAny) {
    return (
      <Tooltip
        content={
          <Box padding={2}>
            <InsufficientPermissionsMessage operationLabel="create a new reference" />
          </Box>
        }
      >
        <div>
          <Button text="Create new" mode="ghost" disabled icon={AddIcon} />
        </div>
      </Tooltip>
    )
  }

  return createOptions.length > 1 ? (
    <MenuButton
      button={<Button {...rest} text="Create new…" mode="ghost" icon={AddIcon} />}
      id={id}
      menu={
        <Menu>
          {createOptions.map((createOption) => (
            <ConditionalTooltip
              enabled={!createOption.permission.granted}
              key={createOption.id}
              content={
                <Box padding={2}>
                  <InsufficientPermissionsMessage operationLabel="create this type of document" />
                </Box>
              }
              portal
            >
              <div>
                <MenuItem
                  disabled={!createOption.permission.granted}
                  icon={createOption.icon}
                  text={createOption.title}
                  onClick={() => onCreate(createOption)}
                />
              </div>
            </ConditionalTooltip>
          ))}
        </Menu>
      }
      placement="right"
      popover={{portal: true, tone: 'default'}}
    />
  ) : (
    <Button
      {...rest}
      text="Create new"
      mode="ghost"
      disabled={!createOptions[0].permission.granted}
      onClick={() => onCreate(createOptions[0])}
      icon={AddIcon}
    />
  )
}
