import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import StateReasonFailedInfo from '../StateReasonFailedInfo'

/**
 * Chromatic sentinel for the failed-schedule info control after the ui5 Text
 * / Flex / Icon migration. The closed trigger is a critical bleed icon
 * button; the open menu (a sibling story) pins the fixture failure copy
 * against the red icon + reason row. `stateReason` is fixture text — no
 * live schedule. Shared with Storybook via a thin CSF wrapper.
 */
export function StateReasonFailedInfoStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 280}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              closed
            </Text>
            <StateReasonFailedInfo stateReason="The document was deleted before the scheduled time." />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
