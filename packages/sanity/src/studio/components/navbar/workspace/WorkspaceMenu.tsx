import {useId} from '@reach/auto-id'
import {SelectIcon} from '@sanity/icons'
import {Button, Menu, MenuButton, MenuButtonProps} from '@sanity/ui'
import React, {useMemo} from 'react'
import {useColorScheme} from '../../../colorScheme'
import {WorkspaceSwitcher} from './WorkspaceSwitcher'

export function WorkspaceMenu() {
  const {scheme} = useColorScheme()

  const popoverProps: MenuButtonProps['popover'] = useMemo(
    () => ({
      placement: 'bottom-end',
      portal: true,
      preventOverflow: true,
      scheme,
    }),
    [scheme]
  )

  return (
    <MenuButton
      id={useId() || ''}
      button={
        <Button
          title="Change workspaces"
          icon={SelectIcon}
          paddingY={2}
          paddingX={1}
          mode="bleed"
        />
      }
      menu={
        <Menu>
          <WorkspaceSwitcher shadow={0} />
        </Menu>
      }
      popover={popoverProps}
    />
  )
}
