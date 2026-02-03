import {TrashIcon} from '@sanity/icons'
import {Box, Menu} from '@sanity/ui'
import {useId} from 'react'

import {MenuButton, MenuItem} from '../../../../../../ui-components'
import {ContextMenuButton} from '../../../../../components/contextMenuButton'
import {useTranslation} from '../../../../../i18n'
import {type ArrayItemError} from '../../../../store'
import {RowLayout} from '../../layouts/RowLayout'
import {IncompatibleItemType} from './IncompatibleItemType'

const MENU_POPOVER_PROPS = {portal: true, tone: 'default'} as const

export function ErrorItem(props: {
  member: ArrayItemError
  sortable?: boolean
  onRemove: () => void
  readOnly?: boolean
}) {
  const {member, sortable, onRemove, readOnly} = props
  const id = useId()

  const {t} = useTranslation()

  return (
    <Box paddingX={1}>
      <RowLayout
        dragHandle={sortable}
        readOnly={!!readOnly}
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
