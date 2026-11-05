import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {ReleasesNav} from '../releases/ReleasesNav'

/**
 * Chromatic sentinel for the classic releases navbar pill restored when
 * variants are off: the Drafts label and chevron inside the rounded Card.
 * The releases-tool control is omitted — ToolLink needs a `tool` route
 * TestWrapper does not register. Shared with Storybook via a thin CSF
 * wrapper.
 */
export function ReleasesNavStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 360}}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            classic pill
          </Text>
          <div data-testid="releases-nav-idle">
            <ReleasesNav />
          </div>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
