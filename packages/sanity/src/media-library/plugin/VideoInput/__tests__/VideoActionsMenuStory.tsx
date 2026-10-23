import {Card, Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {useRef} from 'react'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {MenuItem} from '../../../../ui-components/menuItem/MenuItem'
import {VideoActionsMenu} from '../VideoActionsMenu'

function VideoActionsMenuCanvas({
  aspectRatio,
  isMenuOpen,
}: {
  aspectRatio: number
  isMenuOpen: boolean
}) {
  const menuButtonRef = useRef<HTMLButtonElement | null>(null)

  return (
    <Card padding={3} style={{position: 'relative', maxWidth: 320}}>
      <VideoActionsMenu
        aspectRatio={aspectRatio}
        customDomain=""
        isMenuOpen={isMenuOpen}
        menuButtonRef={menuButtonRef}
        muted
        onMenuOpen={noop}
      >
        <MenuItem text="Replace" />
        <MenuItem text="Delete" tone="critical" />
      </VideoActionsMenu>
    </Card>
  )
}

/**
 * Chromatic sentinel for the muted video field chrome after the ui5 Box
 * migration. Landscape RatioBox shell (no playback id, so the lazy player
 * never mounts) plus the absolute options overlay. Hardcoded
 * `id="video-actions-menu"` allows only one instance. Copy is fixture
 * MenuItems; the options button uses the studio locale.
 */
export function VideoActionsMenuStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            landscape
          </Text>
          <VideoActionsMenuCanvas aspectRatio={16 / 9} isMenuOpen={false} />
        </VStack>
      </Card>
    </TestWrapper>
  )
}

/**
 * Same muted landscape shell with the options menu forced open. Hardcoded
 * `id="video-actions-menu"` allows only one instance.
 */
export function VideoActionsMenuOpenStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{minHeight: 280, position: 'relative', maxWidth: 420}}>
        <VideoActionsMenuCanvas aspectRatio={16 / 9} isMenuOpen />
      </Card>
    </TestWrapper>
  )
}
