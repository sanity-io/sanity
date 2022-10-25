import React, {useCallback, useId} from 'react'
import {EllipsisVerticalIcon, TrashIcon} from '@sanity/icons'
import {Box, Button, Menu, MenuButton, MenuItem} from '@sanity/ui'
import {ArrayItemError} from '../../../../store'
import {useFormCallbacks} from '../../../../studio/contexts/FormCallbacks'
import {PatchEvent, unset} from '../../../../patch'
import {RowLayout} from '../../layouts/RowLayout'
import {ListIncompatibleItemType} from './ListIncompatibleItemType'

const MENU_POPOVER_PROPS = {portal: true, tone: 'default'} as const

export function ListErrorItem(props: {member: ArrayItemError; sortable?: boolean}) {
  const {member, sortable} = props
  const id = useId()
  const {onChange} = useFormCallbacks()

  const handleRemove = useCallback(() => {
    onChange(PatchEvent.from([unset([{_key: member.key}])]))
  }, [onChange, member.key])

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
                <MenuItem text="Remove" tone="critical" icon={TrashIcon} onClick={handleRemove} />
              </Menu>
            }
            popover={MENU_POPOVER_PROPS}
          />
        }
      >
        {member.error.type === 'INVALID_ITEM_TYPE' ? (
          <ListIncompatibleItemType value={member.error.value} />
        ) : (
          <div>Unexpected Error: {member.error.type}</div>
        )}
      </RowLayout>
    </Box>
  )
}
