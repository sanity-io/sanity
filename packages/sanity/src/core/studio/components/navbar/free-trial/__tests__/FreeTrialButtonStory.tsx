import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {FreeTrialButtonSidebar, FreeTrialButtonTopbar} from '../FreeTrialButton'

const NOOP = () => undefined

/**
 * Chromatic sentinel for the free-trial navbar and sidebar buttons after
 * the ui5 Icon migration: topbar bolt plus SVG progress ring (mid-trial
 * purple, late-trial yellow, finished with no ring) and the sidebar bleed
 * row. Tooltips stay closed. Copy is locale-fixture only.
 */
export function FreeTrialButtonStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 360}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              topbar mid trial
            </Text>
            <FreeTrialButtonTopbar daysLeft={5} toggleShowContent={NOOP} totalDays={14} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              topbar late trial
            </Text>
            <FreeTrialButtonTopbar daysLeft={2} toggleShowContent={NOOP} totalDays={14} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              topbar finished
            </Text>
            <FreeTrialButtonTopbar daysLeft={0} toggleShowContent={NOOP} totalDays={14} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              sidebar mid trial
            </Text>
            <FreeTrialButtonSidebar daysLeft={5} toggleShowContent={NOOP} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              sidebar finished
            </Text>
            <FreeTrialButtonSidebar daysLeft={0} toggleShowContent={NOOP} />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
