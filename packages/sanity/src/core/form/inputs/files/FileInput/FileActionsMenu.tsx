import {BinaryDocumentIcon} from '@sanity/icons/BinaryDocument'
import {Card} from '@sanity/ui'
import {type ReactNode, type RefObject} from 'react'
import {Text, Box, Flex, Icon} from 'ui5'

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
    <Flex flexWrap="nowrap" justifyContent="space-between" alignItems="center">
      <Card
        as={muted || disabled ? undefined : 'button'}
        radius={2}
        padding={2}
        tone="inherit"
        onClick={onClick}
        flex={1}
      >
        {/* todo: consider replacing with <SanityDefaultPreview> */}
        <Flex flexWrap="nowrap" alignItems="center">
          <Card padding={3} tone="transparent" shadow={1} radius={1}>
            <Icon
              muted={muted}
              icon={BinaryDocumentIcon}
              style={{margin: '-0.4375rem', display: 'block'}}
            />
          </Card>
          <Flex flexBasis="0%" flexGrow={1} gap={2} marginLeft={3} flexDirection="column">
            <Text
              size={1}
              truncate={1}
              muted={muted}
              data-testid="file-name"
              weight="medium"
              as="div"
              trim={true}
            >
              {originalFilename}
            </Text>
            <Text size={1} muted data-testid="file-size" as="div" trim={true}>
              {formatBytes(size)}
            </Text>
          </Flex>
        </Flex>
      </Card>

      <Box padding={2}>
        <Flex justifyContent="center" gap={2}>
          {accessPolicy === 'private' && <AccessPolicyBadge />}
          <OptionsMenuPopover
            // oxlint-disable-next-line @sanity/i18n/no-attribute-string-literals -- it's a translation key, not an attribute string literal
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
