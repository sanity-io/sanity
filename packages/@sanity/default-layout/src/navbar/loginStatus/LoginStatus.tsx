import React from 'react'
import {UserAvatar} from '@sanity/base/components'
import {Button, MenuItem, Menu, MenuButton, Flex, Box, Text} from '@sanity/ui'
import {ChevronDownIcon, LeaveIcon} from '@sanity/icons'

interface LoginStatusProps {
  onLogout: () => void
}

export function LoginStatus({onLogout}: LoginStatusProps) {
  return (
    <MenuButton
      button={
        <Button mode="bleed" paddingX={1} paddingY={0} title="Toggle user menu">
          <Flex align="center" gap={1}>
            <UserAvatar size="medium" tone="navbar" userId="me" />
            <Box>
              <Text size={1}>
                <ChevronDownIcon />
              </Text>
            </Box>
          </Flex>
        </Button>
      }
      id="login-status-menu"
      menu={
        <Menu>
          <MenuItem text="Sign out" padding={4} icon={LeaveIcon} onClick={onLogout} />
        </Menu>
      }
      placement="bottom-end"
      popover={{portal: true, scheme: 'light'}}
    />
  )
}
