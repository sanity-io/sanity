import React, {ComponentProps} from 'react'
import {AddIcon} from '@sanity/icons'
import {Box, Button, Menu, MenuButton, MenuButtonProps, MenuItem, Tooltip} from '@sanity/ui'
import {useTranslation} from '../../../i18n'
import {InsufficientPermissionsMessage} from '../../../components'
import {useCurrentUser} from '../../../store'
import type {CreateReferenceOption} from './types'

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
  const currentUser = useCurrentUser()

  const {t} = useTranslation()
  const canCreateAny = createOptions.some((option) => option.permission.granted)
  if (!canCreateAny) {
    return (
      <Tooltip
        content={
          <Box padding={2}>
            <InsufficientPermissionsMessage
              currentUser={currentUser}
              context="create-new-reference"
            />
          </Box>
        }
      >
        {/* this wrapper div is needed because disabled button doesn't trigger mouse events */}
        <div style={INLINE_BLOCK_STYLE}>
          <Button
            text={t('inputs.reference.create-new-document')}
            mode="ghost"
            disabled
            icon={AddIcon}
            style={FULL_WIDTH}
          />
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
          text={t('inputs.reference.action-create-new-document-select')}
          mode="ghost"
          icon={AddIcon}
        />
      }
      id={id}
      menu={
        <Menu ref={props.menuRef}>
          {createOptions.map((createOption) => (
            <Tooltip
              disabled={createOption.permission.granted}
              key={createOption.id}
              content={
                <Box padding={2}>
                  <InsufficientPermissionsMessage
                    currentUser={currentUser}
                    context="create-document-type"
                  />
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
                  // eslint-disable-next-line react/jsx-no-bind
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
      text={t('inputs.reference.action-create-new-document')}
      mode="ghost"
      disabled={!createOptions[0].permission.granted || props.readOnly}
      // eslint-disable-next-line react/jsx-no-bind
      onClick={() => onCreate(createOptions[0])}
      icon={AddIcon}
    />
  )
}
