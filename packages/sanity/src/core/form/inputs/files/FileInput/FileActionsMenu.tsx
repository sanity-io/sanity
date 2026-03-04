import {BinaryDocumentIcon} from '@sanity/icons'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {type ReactNode, type RefObject} from 'react'

import {formatBytes} from '../../common/helper'
import {AccessPolicyBadge} from '../common/AccessPolicyBadge'
import {OptionsMenuPopover} from '../common/OptionsMenuPopover'
import {type AssetAccessPolicy} from '../types'

type Props = {
  accessPolicy?: AssetAccessPolicy
  children: ReactNode
  size: number
  originalFilename: string
  onClick?: () => void
  muted?: boolean
  disabled?: boolean
  isMenuOpen: boolean
  onMenuOpen: (flag: boolean) => void
  menuButtonRef: RefObject<HTMLButtonElement | null>
}

export function FileActionsMenu(props: Props) {
  const {
    accessPolicy,
    originalFilename,
    size,
    children,
    muted,
    disabled,
    onClick,
    isMenuOpen,
    onMenuOpen,
    menuButtonRef,
  } = props

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
        <Flex justify="center" gap={2}>
          {accessPolicy === 'private' && <AccessPolicyBadge />}
          <OptionsMenuPopover
            // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals -- it's a translation key, not an attribute string literal
            ariaLabelKey="inputs.file.actions-menu.file-options.aria-label"
            id="file-actions-menu"
            isMenuOpen={isMenuOpen}
            menuButtonRef={menuButtonRef}
            onMenuOpen={onMenuOpen}
          >
            {children}
          </OptionsMenuPopover>
        </Flex>
      </Box>
    </Flex>
  )
}
