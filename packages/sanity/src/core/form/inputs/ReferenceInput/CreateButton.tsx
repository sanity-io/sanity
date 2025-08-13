import {AddIcon} from '@sanity/icons'
import {Menu} from '@sanity/ui'
import {type HTMLProps, type RefObject} from 'react'

import {Button} from '../../../../ui-components/button/Button'
import {MenuButton, type MenuButtonProps} from '../../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../ui-components/menuItem/MenuItem'
import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import {InsufficientPermissionsMessage} from '../../../components/InsufficientPermissionsMessage'
import {useGetI18nText} from '../../../i18n/hooks/useGetI18nText'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useCurrentUser} from '../../../store/user/hooks'
import {type CreateReferenceOption} from './types'

interface Props
  extends Omit<HTMLProps<HTMLButtonElement>, 'as' | 'size' | 'width' | 'type' | 'ref'> {
  id: string
  createOptions: CreateReferenceOption[]
  menuRef?: RefObject<HTMLDivElement | null>
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
  const currentUser = useCurrentUser()

  const {t} = useTranslation()
  const getI18nText = useGetI18nText(createOptions)

  const canCreateAny = createOptions.some((option) => option.permission.granted)
  if (!canCreateAny) {
    return (
      <Tooltip
        content={
          <InsufficientPermissionsMessage
            currentUser={currentUser}
            context="create-new-reference"
          />
        }
      >
        {/* this wrapper div is needed because disabled button doesn't trigger mouse events */}
        <div style={INLINE_BLOCK_STYLE}>
          <Button
            text={t('inputs.reference.action.create-new-document')}
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
          text={t('inputs.reference.action.create-new-document-select')}
          mode="ghost"
          icon={AddIcon}
          size="large"
        />
      }
      id={id}
      menu={
        <Menu ref={menuRef}>
          {createOptions.map((createOption) => (
            <Tooltip
              key={createOption.id}
              disabled={createOption.permission.granted}
              content={
                <InsufficientPermissionsMessage
                  currentUser={currentUser}
                  context="create-document-type"
                />
              }
              portal
            >
              {/* this wrapper div is needed because disabled button doesn't trigger mouse events */}
              <div>
                <MenuItem
                  disabled={!createOption.permission.granted}
                  icon={createOption.icon}
                  text={getI18nText(createOption).title}
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
      text={t('inputs.reference.action.create-new-document-select')}
      mode="ghost"
      disabled={!createOptions[0].permission.granted || props.readOnly}
      // eslint-disable-next-line react/jsx-no-bind
      onClick={() => onCreate(createOptions[0])}
      icon={AddIcon}
      size="large"
      data-testid={`create-new-document-select-${id}`}
    />
  )
}
