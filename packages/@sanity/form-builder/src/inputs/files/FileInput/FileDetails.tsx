import {BinaryDocumentIcon, EllipsisVerticalIcon} from '@sanity/icons'
import React, {ReactNode} from 'react'

import {Box, Button, Card, Flex, Inline, Menu, MenuButton, Stack, Text} from '@sanity/ui'
import {formatBytes} from '../../common/helper'

type Props = {
  children: ReactNode
  size: number
  originalFilename: string
  onClick: () => void
  muted: boolean
  disabled: boolean
}

export function FileDetails(props: Props) {
  const {originalFilename, size, children, muted, disabled, onClick} = props

  return (
    <Flex wrap="nowrap" justify="space-between" align="center">
      <Card
        as={muted || disabled ? undefined : 'button'}
        tabIndex={disabled ? undefined : 0}
        __unstable_focusRing
        radius={2}
        padding={2}
        tone="inherit"
        onClick={onClick}
      >
        <Flex wrap="nowrap" align="center">
          <Card padding={3} tone="transparent" shadow={1} radius={1}>
            <Text muted={muted}>
              <BinaryDocumentIcon />
            </Text>
          </Card>
          <Stack flex={1} space={2} marginLeft={3}>
            <Text size={2} textOverflow="ellipsis" muted={muted} data-testid="file-name">
              {originalFilename}
            </Text>
            <Text size={1} muted data-testid="file-size">
              {formatBytes(size)}
            </Text>
          </Stack>
        </Flex>
      </Card>
      <Box marginRight={2}>
        <MenuButton
          button={
            <Button icon={EllipsisVerticalIcon} mode="bleed" data-testid="options-menu-button" />
          }
          popover={{tone: 'default'}}
          id="menu-button-example"
          menu={<Menu>{children}</Menu>}
        />
      </Box>
    </Flex>
  )
}
