/* eslint-disable complexity */
/* eslint-disable max-nested-callbacks,no-nested-ternary */

import React, {ComponentProps} from 'react'
import {AddIcon} from '@sanity/icons'
import {Box, Button, Menu, MenuButton, MenuItem, Tooltip} from '@sanity/ui'
import {InsufficientPermissionsMessage} from '../../../components/InsufficientPermissionsMessage'
import {CreateReferenceOption} from './types'

interface Props extends ComponentProps<typeof Button> {
  id: string
  createOptions: CreateReferenceOption[]
  menuRef: React.RefObject<HTMLDivElement>
  onCreate: (option: CreateReferenceOption) => void
}

function ConditionalTooltip(
  props: ComponentProps<typeof Tooltip> & {enabled: boolean}
): React.ReactElement {
  const {enabled, ...rest} = props
  return enabled ? <Tooltip {...rest} /> : <>{props.children}</>
}

const INLINE_BLOCK_STYLE = {display: 'inline-flex'}
const FULL_WIDTH = {width: '100%'}

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
        {/* this wrapper div is needed because disabled button doesn't trigger mouse events */}
        <div style={INLINE_BLOCK_STYLE}>
          <Button text="Create new" mode="ghost" disabled icon={AddIcon} style={FULL_WIDTH} />
        </div>
      </Tooltip>
    )
  }

  return createOptions.length > 1 ? (
    <MenuButton
      button={<Button {...rest} text="Create new…" mode="ghost" icon={AddIcon} />}
      id={id}
      menu={
        <Menu ref={props.menuRef}>
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
              {/* this wrapper div is needed because disabled button doesn't trigger mouse events */}
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
      popover={{portal: true, tone: 'default', constrainSize: true}}
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
