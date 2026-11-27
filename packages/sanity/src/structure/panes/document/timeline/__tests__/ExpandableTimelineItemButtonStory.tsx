import {Card} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {ExpandableTimelineItemButton} from '../expandableTimelineItemButton'

/**
 * Chromatic sentinel for the timeline row expand/collapse control after the
 * Panda `flipIcon` rotation: collapsed chevron vs expanded (`data-expanded`
 * rotates -90deg). Tooltips stay closed. Shared with Storybook via a thin
 * CSF wrapper.
 */
export function ExpandableTimelineItemButtonStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 240}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              collapsed
            </Text>
            <ExpandableTimelineItemButton isExpanded={false} onExpand={noop} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              expanded
            </Text>
            <ExpandableTimelineItemButton isExpanded onExpand={noop} />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
