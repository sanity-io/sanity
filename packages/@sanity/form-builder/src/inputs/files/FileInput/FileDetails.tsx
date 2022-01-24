import {BinaryDocumentIcon, EllipsisVerticalIcon} from '@sanity/icons'
import React, {ReactNode, useState} from 'react'

import {
  Box,
  Button,
  Card,
  Flex,
  Inline,
  Menu,
  MenuButton,
  Popover,
  Stack,
  Text,
  useClickOutside,
} from '@sanity/ui'
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

  const [isMenuOpen, setMenuOpen] = useState(false)
  const [menuElement, setMenuRef] = useState<HTMLDivElement | null>(null)

  const handleClick = React.useCallback(() => setMenuOpen(!isMenuOpen), [setMenuOpen, isMenuOpen])

  useClickOutside(
    React.useCallback(() => setMenuOpen(false), [setMenuOpen]),
    [menuElement]
  )

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
        <Popover content={<Menu ref={setMenuRef}>{children}</Menu>} portal open={isMenuOpen}>
          <Button
            icon={EllipsisVerticalIcon}
            mode="bleed"
            data-testid="options-menu-button"
            onClick={handleClick}
          />
        </Popover>
      </Box>
    </Flex>
  )
}
