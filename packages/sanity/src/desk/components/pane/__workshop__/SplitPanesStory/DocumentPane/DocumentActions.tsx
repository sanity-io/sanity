import {ChevronDownIcon, PublishIcon} from '@sanity/icons'
import {Flex, Menu, MenuButton, MenuButtonProps, Stack, useToast} from '@sanity/ui'
import React, {useCallback} from 'react'
import {Button, MenuItem} from '../../../../../../ui'

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
        button={<Button icon={ChevronDownIcon} mode="ghost" />}
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
