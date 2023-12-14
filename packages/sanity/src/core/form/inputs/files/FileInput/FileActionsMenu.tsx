import {BinaryDocumentIcon} from '@sanity/icons'
import React, {ReactNode, useCallback, useEffect, useState} from 'react'
import {Box, Card, Flex, Menu, Stack, Text, useClickOutside, useGlobalKeyDown} from '@sanity/ui'
import {formatBytes} from '../../common/helper'
import {useTranslation} from '../../../../i18n'
import {Popover} from '../../../../../ui'
import {ContextMenuButton} from '../../../../../ui/contextMenuButton'

type Props = {
  children: ReactNode
  size: number
  originalFilename: string
  onClick?: () => void
  muted?: boolean
  disabled?: boolean
  isMenuOpen: boolean
  onMenuOpen: (flag: boolean) => void
  setMenuButtonElement: (element: HTMLButtonElement | null) => void
}

export function FileActionsMenu(props: Props) {
  const {
    originalFilename,
    size,
    children,
    muted,
    disabled,
    onClick,
    isMenuOpen,
    onMenuOpen,
    setMenuButtonElement,
  } = props
  const [menuElement, setMenuElement] = useState<HTMLDivElement | null>(null)
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null)

  const handleClick = useCallback(() => onMenuOpen(true), [onMenuOpen])

  useGlobalKeyDown(
    useCallback(
      (event) => {
        if (isMenuOpen && (event.key === 'Escape' || event.key === 'Tab')) {
          onMenuOpen(false)
          buttonElement?.focus()
        }
      },
      [isMenuOpen, onMenuOpen, buttonElement],
    ),
  )

  // Close menu when clicking outside of it
  // Not when clicking on the button
  useClickOutside(
    useCallback(
      (event) => {
        if (!buttonElement?.contains(event.target as Node)) {
          onMenuOpen(false)
        }
      },
      [buttonElement, onMenuOpen],
    ),
    [menuElement],
  )

  const setOptionsButtonRef = useCallback(
    (el: HTMLButtonElement | null) => {
      // Pass the button element to the parent component so that it can focus it when e.g. closing dialogs
      setMenuButtonElement(el)

      // Set focus back on the button when closing the menu
      setButtonElement(el)
    },
    [setMenuButtonElement],
  )

  // When the popover is open, focus the menu to enable keyboard navigation
  useEffect(() => {
    if (isMenuOpen) {
      menuElement?.focus()
    }
  }, [isMenuOpen, menuElement])

  const {t} = useTranslation()

  return (
    <Flex wrap="nowrap" justify="space-between" align="center">
      <Card
        as={muted || disabled ? undefined : 'button'}
        radius={2}
        padding={2}
        tone="inherit"
        onClick={onClick}
        flex={1}
      >
        {/* todo: consider replacing with <SanityDefaultPreview> */}
        <Flex wrap="nowrap" align="center">
          <Card padding={3} tone="transparent" shadow={1} radius={1}>
            <Text muted={muted}>
              <BinaryDocumentIcon />
            </Text>
          </Card>
          <Stack flex={1} space={2} marginLeft={3}>
            <Text
              size={1}
              textOverflow="ellipsis"
              muted={muted}
              data-testid="file-name"
              weight="medium"
            >
              {originalFilename}
            </Text>
            <Text size={1} muted data-testid="file-size">
              {formatBytes(size)}
            </Text>
          </Stack>
        </Flex>
      </Card>

      <Box padding={2}>
        <Flex justify="center">
          {/* Using a customized Popover instead of MenuButton because a MenuButton will close on click
     and break replacing an uploaded file. */}
          <Popover
            content={<Menu ref={setMenuElement}>{children}</Menu>}
            id="file-actions-menu"
            portal
            open={isMenuOpen}
            constrainSize
          >
            <ContextMenuButton
              aria-label={t('inputs.file.actions-menu.file-options.aria-label')}
              data-testid="options-menu-button"
              onClick={handleClick}
              paddingY={3}
              ref={setOptionsButtonRef}
            />
          </Popover>
        </Flex>
      </Box>
    </Flex>
  )
}
