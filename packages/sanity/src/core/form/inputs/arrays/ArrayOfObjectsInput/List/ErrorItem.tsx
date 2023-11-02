import React, {useId} from 'react'
import {EllipsisVerticalIcon, TrashIcon} from '@sanity/icons'
import {Box, Button, Menu, MenuButton} from '@sanity/ui'
import {MenuItem} from '../../../../../../ui'
import {ArrayItemError} from '../../../../store'
import {RowLayout} from '../../layouts/RowLayout'
import {IncompatibleItemType} from './IncompatibleItemType'

const MENU_POPOVER_PROPS = {portal: true, tone: 'default'} as const

export function ErrorItem(props: {
  member: ArrayItemError
  sortable?: boolean
  onRemove: () => void
}) {
  const {member, sortable, onRemove} = props
  const id = useId()

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
                <MenuItem text="Remove" tone="critical" icon={TrashIcon} onClick={onRemove} />
              </Menu>
            }
            popover={MENU_POPOVER_PROPS}
          />
        }
      >
        {member.error.type === 'INVALID_ITEM_TYPE' ? (
          <IncompatibleItemType value={member.error.value} />
        ) : (
          <div>Unexpected Error: {member.error.type}</div>
        )}
      </RowLayout>
    </Box>
  )
}
