import {Card, Text} from '@sanity/ui'
import {useRef} from 'react'
import {Flex, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {ActionsMenu} from '../../common/ActionsMenu'
import {MenuActionsWrapper} from '../../common/MenuActionsWrapper.styled'
import {OptionsMenuPopover} from '../../common/OptionsMenuPopover'
import {ImageActionsMenu} from '../ImageActionsMenu'

const SCHEMA_TYPES: [] = []
const NOOP = () => undefined
const FIXTURE_URL = 'https://example.com/hero.png'

function ClosedImageActionsMenu({showEdit}: {showEdit: boolean}) {
  const menuButtonRef = useRef<HTMLButtonElement | null>(null)

  return (
    <Card
      padding={4}
      style={{height: 120, overflow: 'hidden', position: 'relative', width: 200}}
      tone="transparent"
    >
      <ImageActionsMenu
        isMenuOpen={false}
        menuButtonRef={menuButtonRef}
        onEdit={NOOP}
        onMenuOpen={NOOP}
        setHotspotButtonElement={NOOP}
        showEdit={showEdit}
      >
        <MenuItems />
      </ImageActionsMenu>
    </Card>
  )
}

function MenuItems() {
  return (
    <ActionsMenu
      browse={null}
      copyUrl={FIXTURE_URL}
      downloadUrl={FIXTURE_URL}
      onReset={NOOP}
      upload={null}
    />
  )
}

function OpenOptionsMenu() {
  const menuButtonRef = useRef<HTMLButtonElement | null>(null)

  return (
    <Card padding={4} style={{minHeight: 320, position: 'relative', width: 280}} tone="transparent">
      <MenuActionsWrapper data-buttons gap={1} padding={2}>
        <OptionsMenuPopover
          ariaLabelKey="inputs.image.actions-menu.options.aria-label"
          buttonMode="ghost"
          id="image-actions-menu-open"
          isMenuOpen
          menuButtonRef={menuButtonRef}
          onMenuOpen={NOOP}
          openOnClick="toggle"
        >
          <MenuItems />
        </OptionsMenuPopover>
      </MenuActionsWrapper>
    </Card>
  )
}

/**
 * Chromatic sentinel for image/file input action chrome after the Sanity UI
 * to ui5 migration: crop + options overlay (closed), options-only, and the
 * open options menu (Download / Copy URL / Clear field). Absolute overlay
 * positioning and Menu tones are a mix TypeScript will not catch. Skip the
 * animated wait placeholder.
 */
export function ImageActionsMenuStory() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <Flex gap={6} padding={4} flexWrap="wrap">
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            crop and options, closed
          </Text>
          <ClosedImageActionsMenu showEdit />
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            options only, closed
          </Text>
          <ClosedImageActionsMenu showEdit={false} />
        </VStack>
      </Flex>
    </TestWrapper>
  )
}

/**
 * Open options menu: Download, Copy URL, and the critical Clear field item.
 * `isMenuOpen` is a prop so the snapshot does not depend on a click.
 */
export function ImageActionsMenuOpenStory() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <OpenOptionsMenu />
    </TestWrapper>
  )
}
