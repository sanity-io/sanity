import React, {useCallback, useId} from 'react'
import {EllipsisVerticalIcon, TrashIcon} from '@sanity/icons'
import {Box, Button, Menu, MenuButton, MenuItem} from '@sanity/ui'
import {ArrayItemError} from '../../../../store'
import {RowLayout} from '../../layouts/RowLayout'
import {useTranslation} from '../../../../../i18n'
import {IncompatibleItemType} from './IncompatibleItemType'

const MENU_POPOVER_PROPS = {portal: true, tone: 'default'} as const

export function ErrorItem(props: {
  member: ArrayItemError
  sortable?: boolean
  onRemove: () => void
}) {
  const {member, sortable, onRemove} = props
  const id = useId()

  const {t} = useTranslation()

  return (
    <Box paddingX={1}>
      <RowLayout
        dragHandle={sortable}
        tone="caution"
        menu={
          <MenuButton
            button={<Button padding={2} mode="bleed" icon={EllipsisVerticalIcon} />}
            id={`${id}-menuButton`}
            menu={
              <Menu>
                <MenuItem
                  text={t('inputs.array.action.remove-invalid-item')}
                  tone="critical"
                  icon={TrashIcon}
                  onClick={onRemove}
                />
              </Menu>
            }
            popover={MENU_POPOVER_PROPS}
          />
        }
      >
        {member.error.type === 'INVALID_ITEM_TYPE' ? (
          <IncompatibleItemType value={member.error.value} />
        ) : (
          <div>{t('inputs.array.error.unexpected-error', {error: member.error.type})}</div>
        )}
      </RowLayout>
    </Box>
  )
}
