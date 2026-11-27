import {Card, Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {FreeTrialButtonSidebar, FreeTrialButtonTopbar} from '../FreeTrialButton'

/**
 * Chromatic sentinel for the free-trial navbar buttons after the
 * vanilla-extract stroke overlay landed. The topbar ring colour flips
 * from purple to yellow after 75% of the trial, and the finished state
 * drops the ring; the sidebar is a full-width bleed label. Copy is from
 * the studio locale bundle (fixed day counts, no live trial dates).
 */
export function FreeTrialButtonStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 360}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              topbar early trial
            </Text>
            <FreeTrialButtonTopbar daysLeft={10} toggleShowContent={noop} totalDays={14} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              topbar late trial
            </Text>
            <FreeTrialButtonTopbar daysLeft={2} toggleShowContent={noop} totalDays={14} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              topbar finished
            </Text>
            <FreeTrialButtonTopbar daysLeft={0} toggleShowContent={noop} totalDays={14} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              sidebar remaining
            </Text>
            <FreeTrialButtonSidebar daysLeft={5} toggleShowContent={noop} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              sidebar finished
            </Text>
            <FreeTrialButtonSidebar daysLeft={0} toggleShowContent={noop} />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
