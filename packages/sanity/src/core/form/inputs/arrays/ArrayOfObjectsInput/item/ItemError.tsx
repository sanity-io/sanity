import React, {useCallback, useId} from 'react'
import {EllipsisVerticalIcon, TrashIcon} from '@sanity/icons'
import {Button, Box, Menu, MenuButton, MenuItem} from '@sanity/ui'
import {RowLayout} from '../RowLayout'
import {MemberItemError} from '../../../../members'
import {ArrayItemError} from '../../../../store'
import {useFormCallbacks} from '../../../../studio/contexts/FormCallbacks'
import {PatchEvent, unset} from '../../../../patch'

const MENU_POPOVER_PROPS = {portal: true, tone: 'default'} as const

export function ItemError(props: {member: ArrayItemError; sortable?: boolean}) {
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
        <MemberItemError member={member} />
      </RowLayout>
    </Box>
  )
}
