import {PublishIcon} from '@sanity/icons'
import {Flex, Menu, Stack, useToast} from '@sanity/ui'
import React, {useCallback} from 'react'
import {ContextMenuButton} from 'sanity'
import {Button, MenuButton, MenuButtonProps, MenuItem} from 'sanity/_internal-ui-components'

const MENU_BUTTON_POPOVER_PROPS: MenuButtonProps['popover'] = {
  constrainSize: true,
  portal: true,
}

export function DocumentActions() {
  const {push: pushToast} = useToast()

  const publish = useCallback(
    () => pushToast({status: 'success', title: 'Successfully published'}),
    [pushToast],
  )

  return (
    <Flex gap={1}>
      <Stack flex={1}>
        <Button icon={PublishIcon} onClick={publish} text="Publish" tone="default" />
      </Stack>
      <MenuButton
        button={<ContextMenuButton />}
        id="actions"
        menu={
          <Menu>
            <MenuItem text="Discard changes" />
          </Menu>
        }
        popover={MENU_BUTTON_POPOVER_PROPS}
      />
    </Flex>
  )
}
