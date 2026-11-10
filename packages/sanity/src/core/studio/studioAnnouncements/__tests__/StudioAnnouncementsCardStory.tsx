import noop from 'lodash-es/noop.js'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {StudioAnnouncementsCard} from '../StudioAnnouncementsCard'

/**
 * Chromatic sentinel for the floating "What's new" card after the ui5
 * VStack/Box migration. Pre-header and title stack in a VStack, with a Box
 * right margin reserving room for the hover-only dismiss button — the gap and
 * margin are what this pins. The card is an open, portaled Popover pinned to
 * the bottom-left corner, exactly as `StudioAnnouncementsProvider` mounts it.
 * Copy is a fixture (no announcements fetch); `useTelemetry` falls back to
 * its no-op logger outside a `TelemetryProvider`.
 */
export function StudioAnnouncementsCardStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <StudioAnnouncementsCard
        id="announcement-fixture"
        isOpen
        name="content-releases-ga"
        onCardClick={noop}
        onCardDismiss={noop}
        preHeader="What's new"
        title="Content Releases are now generally available"
      />
    </TestWrapper>
  )
}
