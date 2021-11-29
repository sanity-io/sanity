import React from 'react'
import {UserAvatar} from '@sanity/base/components'
import type {MenuButtonProps} from '@sanity/ui'
import {Button, MenuItem, Menu, MenuButton, Flex, Box, Text} from '@sanity/ui'
import {ChevronDownIcon, LeaveIcon} from '@sanity/icons'
import styled from 'styled-components'

interface LoginStatusProps {
  onLogout: () => void
}

const StyledMenu = styled(Menu)`
  min-width: 125px;
`

const MENU_BUTTON_POPOVER_PROPS: MenuButtonProps['popover'] = {
  portal: true,
  scheme: 'light',
  placement: 'bottom-end',
}

export function LoginStatus({onLogout}: LoginStatusProps) {
  return (
    <MenuButton
      button={
        <Button mode="bleed" paddingX={1} paddingY={0} title="Toggle user menu">
          <Flex align="center">
            <UserAvatar size="medium" tone="navbar" userId="me" />
            <Box marginLeft={1}>
              <Text size={1}>
                <ChevronDownIcon />
              </Text>
            </Box>
          </Flex>
        </Button>
      }
      id="login-status-menu"
      menu={
        <StyledMenu>
          <MenuItem text="Sign out" iconRight={LeaveIcon} onClick={onLogout} />
        </StyledMenu>
      }
      popover={MENU_BUTTON_POPOVER_PROPS}
    />
  )
}
