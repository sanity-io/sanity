import React, {useCallback, useId} from 'react'
import {EllipsisHorizontalIcon, TrashIcon} from '@sanity/icons'
import {Menu, MenuButton} from '@sanity/ui'
import {ArrayItemError} from '../../../../store'
import {useFormCallbacks} from '../../../../studio/contexts/FormCallbacks'
import {PatchEvent, unset} from '../../../../patch'
import {CellLayout} from '../../layouts/CellLayout'
import {MenuItem, Button} from '../../../../../../ui'
import {useTranslation} from '../../../../../i18n'
import {IncompatibleItemType} from './IncompatibleItemType'

const MENU_POPOVER_PROPS = {portal: true, tone: 'default'} as const

export function ErrorItem(props: {member: ArrayItemError; sortable?: boolean}) {
  const {member, sortable} = props
  const id = useId()
  const {onChange} = useFormCallbacks()
  const {t} = useTranslation()

  const handleRemove = useCallback(() => {
    onChange(PatchEvent.from([unset([{_key: member.key}])]))
  }, [onChange, member.key])

  return (
    <CellLayout
      dragHandle={sortable}
      tone="caution"
      style={{height: '100%'}}
      menu={
        <MenuButton
          button={
            <Button
              mode="bleed"
              icon={EllipsisHorizontalIcon}
              tooltipProps={{content: 'Show more'}}
            />
          }
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
