import React, {ComponentProps} from 'react'
import {AddIcon} from '@sanity/icons'
import {Box, Button, Menu, MenuButton, MenuButtonProps, MenuItem, Tooltip} from '@sanity/ui'
import {InsufficientPermissionsMessage} from '../../../components'
import {CreateReferenceOption} from './types'

interface Props extends ComponentProps<typeof Button> {
  id: string
  createOptions: CreateReferenceOption[]
  menuRef?: React.RefObject<HTMLDivElement>
  onCreate: (option: CreateReferenceOption) => void
  readOnly?: boolean
}

const INLINE_BLOCK_STYLE = {display: 'inline-flex'}
const FULL_WIDTH = {width: '100%'}

const POPOVER_PROPS: MenuButtonProps['popover'] = {
  portal: true,
  tone: 'default',
  constrainSize: true,
  fallbackPlacements: ['bottom', 'left', 'top'],
  placement: 'right',
  preventOverflow: true,
}

export function CreateButton(props: Props) {
  const {createOptions, onCreate, id, menuRef, ...rest} = props

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
        {/* this wrapper div is needed because disabled button doesn't trigger mouse events */}
        <div style={INLINE_BLOCK_STYLE}>
          <Button text="Create new" mode="ghost" disabled icon={AddIcon} style={FULL_WIDTH} />
        </div>
      </Tooltip>
    )
  }

  return createOptions.length > 1 ? (
    <MenuButton
      button={
        <Button
          {...rest}
          disabled={props.readOnly}
          text="Create new…"
          mode="ghost"
          icon={AddIcon}
        />
      }
      id={id}
      menu={
        <Menu ref={menuRef}>
          {createOptions.map((createOption) => (
            <Tooltip
              disabled={createOption.permission.granted}
              key={createOption.id}
              content={
                <Box padding={2}>
                  <InsufficientPermissionsMessage operationLabel="create this type of document" />
                </Box>
              }
              portal
            >
              {/* this wrapper div is needed because disabled button doesn't trigger mouse events */}
              <div>
                <MenuItem
                  disabled={!createOption.permission.granted}
                  icon={createOption.icon}
                  text={createOption.title}
                  onClick={() => onCreate(createOption)}
                />
              </div>
            </Tooltip>
          ))}
        </Menu>
      }
      popover={POPOVER_PROPS}
    />
  ) : (
    <Button
      {...rest}
      text="Create new"
      mode="ghost"
      disabled={!createOptions[0].permission.granted || props.readOnly}
      onClick={() => onCreate(createOptions[0])}
      icon={AddIcon}
    />
  )
}
