import React, {useId} from 'react'
import {TrashIcon} from '@sanity/icons'
import {Box, Menu, MenuButton} from '@sanity/ui'
import {ArrayItemError} from '../../../../store'
import {RowLayout} from '../../layouts/RowLayout'
import {MenuItem} from '../../../../../../ui'
import {ContextMenuButton} from '../../../../../../ui/contextMenuButton'
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
            button={<ContextMenuButton />}
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
