import React, {useCallback, useId} from 'react'
import {EllipsisVerticalIcon, TrashIcon} from '@sanity/icons'
import {Button, Menu, MenuButton, MenuItem} from '@sanity/ui'
import {ArrayItemError} from '../../../../store'
import {useFormCallbacks} from '../../../../studio/contexts/FormCallbacks'
import {PatchEvent, unset} from '../../../../patch'
import {CellLayout} from '../../layouts/CellLayout'
import {IncompatibleItemType} from './IncompatibleItemType'

const MENU_POPOVER_PROPS = {portal: true, tone: 'default'} as const

export function ErrorItem(props: {member: ArrayItemError; sortable?: boolean}) {
  const {member, sortable} = props
  const id = useId()
  const {onChange} = useFormCallbacks()

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
          button={<Button padding={2} mode="bleed" icon={EllipsisVerticalIcon} />}
          id={`${id}-menuButton`}
          menu={
            <Menu>
              <MenuItem text="Remove" tone="critical" icon={TrashIcon} onClick={handleRemove} />
            </Menu>
          }
          popover={MENU_POPOVER_PROPS}
        />
      }
    >
      {member.error.type === 'INVALID_ITEM_TYPE' ? (
        <IncompatibleItemType value={member.error.value} vertical />
      ) : (
        <div>Unexpected Error: {member.error.type}</div>
      )}
    </CellLayout>
  )
}
