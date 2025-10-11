import {TrashIcon} from '@sanity/icons'
import {Menu} from '@sanity/ui'
import {useCallback, useId} from 'react'

import {MenuButton, MenuItem} from '../../../../../../ui-components'
import {ContextMenuButton} from '../../../../../components/contextMenuButton'
import {useTranslation} from '../../../../../i18n'
import {useParentArrayInput} from '../../../../members/object/fields/ArrayOfObjectsField'
import {PatchEvent, unset} from '../../../../patch'
import {type ArrayItemError} from '../../../../store'
import {useFormCallbacks} from '../../../../studio/contexts/FormCallbacks'
import {CellLayout} from '../../layouts/CellLayout'
import {IncompatibleItemType} from './IncompatibleItemType'

const MENU_POPOVER_PROPS = {portal: true, tone: 'default'} as const

export function ErrorItem(props: {member: ArrayItemError; sortable?: boolean; readOnly?: boolean}) {
  const {member, sortable, readOnly} = props
  const {active, onItemUnselect, selectedItemKeys, onItemSelect} = useParentArrayInput(true)

  const id = useId()
  const {onChange} = useFormCallbacks()
  const {t} = useTranslation()

  const handleRemove = useCallback(() => {
    onChange(PatchEvent.from([unset([{_key: member.key}])]))
  }, [onChange, member.key])

  const handleSelect = useCallback(() => {
    onItemSelect(member.key)
  }, [member.key, onItemSelect])
  const handleUnselect = useCallback(() => {
    onItemUnselect(member.key)
  }, [member.key, onItemUnselect])

  return (
    <CellLayout
      readOnly={readOnly}
      selectable={active}
      selected={selectedItemKeys.includes(member.key)}
      onSelect={handleSelect}
      onUnselect={handleUnselect}
      tone="caution"
      style={{height: '100%'}}
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
                onClick={handleRemove}
              />
            </Menu>
          }
          popover={MENU_POPOVER_PROPS}
        />
      }
    >
      {member.error.type === 'INVALID_ITEM_TYPE' ? (
        <IncompatibleItemType value={member.error.value} vertical />
      ) : (
        <div>{t('inputs.array.error.unexpected-error', {error: member.error.type})}</div>
      )}
    </CellLayout>
  )
}
