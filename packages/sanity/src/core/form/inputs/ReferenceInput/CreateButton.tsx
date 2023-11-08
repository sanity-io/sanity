import React, {ComponentProps} from 'react'
import {AddIcon} from '@sanity/icons'
import {Menu, MenuButton, MenuButtonProps} from '@sanity/ui'
import {InsufficientPermissionsMessage} from '../../../components'
import {Button, MenuItem, TooltipWithNodes} from '../../../../ui'
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
  const {createOptions, onCreate, id, ...rest} = props

  const canCreateAny = createOptions.some((option) => option.permission.granted)
  if (!canCreateAny) {
    return (
      <TooltipWithNodes
        content={<InsufficientPermissionsMessage operationLabel="create a new reference" />}
      >
        {/* this wrapper div is needed because disabled button doesn't trigger mouse events */}
        <div style={INLINE_BLOCK_STYLE}>
          <Button text="Create new" mode="ghost" disabled icon={AddIcon} style={FULL_WIDTH} />
        </div>
      </TooltipWithNodes>
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
        <Menu ref={props.menuRef}>
          {createOptions.map((createOption) => (
            <TooltipWithNodes
              disabled={createOption.permission.granted}
              key={createOption.id}
              content={
                <InsufficientPermissionsMessage operationLabel="create this type of document" />
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
            </TooltipWithNodes>
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
