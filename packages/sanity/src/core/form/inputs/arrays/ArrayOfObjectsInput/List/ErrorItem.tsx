import {TrashIcon} from '@sanity/icons'
import {Box, Menu} from '@sanity/ui'
import {useCallback, useId} from 'react'

import {MenuButton, MenuItem} from '../../../../../../ui-components'
import {ContextMenuButton} from '../../../../../components/contextMenuButton'
import {useTranslation} from '../../../../../i18n'
import {useParentArrayInput} from '../../../../members/object/fields/ArrayOfObjectsField'
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
  const {active, onItemUnselect, selectedItemKeys, onItemSelect} = useParentArrayInput(true)

  const {t} = useTranslation()
  const handleSelect = useCallback(() => {
    onItemSelect(member.key)
  }, [member.key, onItemSelect])
  const handleUnselect = useCallback(() => {
    onItemUnselect(member.key)
  }, [member.key, onItemUnselect])

  return (
    <Box paddingX={1}>
      <RowLayout
        readOnly={!!readOnly}
        tone="caution"
        selectable={active}
        selected={selectedItemKeys.includes(member.key)}
        onSelect={handleSelect}
        onUnselect={handleUnselect}
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
