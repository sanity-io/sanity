import {Card, Stack, Text} from '@sanity/ui'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {ChangeBreadcrumb} from '../ChangeBreadcrumb'

/**
 * Chromatic sentinel for array index segments in review-changes breadcrumbs:
 * ui5 Box padding on `#n`, added, removed, and moved items. DiffCard tooltips
 * stay closed. Shared with Storybook via a thin CSF wrapper.
 */
export function ChangeTitleSegmentStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 480}}>
        <Stack gap={5}>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              unchanged index
            </Text>
            <ChangeBreadcrumb
              titlePath={['Authors', {hasMoved: false, fromIndex: 1, toIndex: 1}, 'Name']}
            />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              item added
            </Text>
            <ChangeBreadcrumb titlePath={['Authors', {hasMoved: false, toIndex: 0}]} />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              item removed
            </Text>
            <ChangeBreadcrumb titlePath={['Authors', {hasMoved: false, fromIndex: 3}]} />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              item moved
            </Text>
            <ChangeBreadcrumb titlePath={['Authors', {hasMoved: true, fromIndex: 4, toIndex: 1}]} />
          </Stack>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
