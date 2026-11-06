import {Card} from '@sanity/ui'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {NoChanges} from '../NoChanges'

/**
 * Chromatic sentinel for the review-changes empty state after the ui5 Flex
 * migration: column gap, paddingTop, and muted description under the title.
 * Copy is static i18n (studio namespace). Shared with Storybook via a thin
 * CSF wrapper.
 */
export function NoChangesStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <NoChanges />
      </Card>
    </TestWrapper>
  )
}
