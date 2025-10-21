import {TrashIcon} from '@sanity/icons'
import {Menu} from '@sanity/ui'
import {useCallback, useId} from 'react'

import {MenuButton} from '../../../../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../../../ui-components/menuItem/MenuItem'
import {ContextMenuButton} from '../../../../../components/contextMenuButton/ContextMenuButton'
import {useTranslation} from '../../../../../i18n/hooks/useTranslation'
import {unset} from '../../../../patch/patch'
import {PatchEvent} from '../../../../patch/PatchEvent'
import {type ArrayItemError} from '../../../../store/types/memberErrors'
import {useFormCallbacks} from '../../../../studio/contexts/FormCallbacks'
import {CellLayout} from '../../layouts/CellLayout'
import {IncompatibleItemType} from './IncompatibleItemType'

const MENU_POPOVER_PROPS = {portal: true, tone: 'default'} as const

export function ErrorItem(props: {member: ArrayItemError; sortable?: boolean; readOnly?: boolean}) {
  const {member, sortable, readOnly} = props
  const id = useId()
  const {onChange} = useFormCallbacks()
  const {t} = useTranslation()

  const handleRemove = useCallback(() => {
    onChange(PatchEvent.from([unset([{_key: member.key}])]))
  }, [onChange, member.key])

  return (
    <CellLayout
      dragHandle={sortable}
      readOnly={readOnly}
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
