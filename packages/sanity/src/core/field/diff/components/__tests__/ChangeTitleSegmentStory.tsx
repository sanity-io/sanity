import {Card} from '@sanity/ui'
import {HStack, Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {type Annotation} from '../../../types'
import {ChangeBreadcrumb} from '../ChangeBreadcrumb'
import {ChangeTitleSegment} from '../ChangeTitleSegment'

// A fixed past timestamp so the annotation color is deterministic and no
// relative-time text can drift.
const ANNOTATION: Annotation = {author: 'doug', timestamp: '2020-06-15T12:00:00.000Z'}

/**
 * Chromatic sentinel for array index segments in review-changes breadcrumbs:
 * ui5 Box padding on `#n`, added, removed, and moved items, plus the bare
 * ChangeTitleSegment variants (string title, annotated added / removed /
 * moved DiffCards). DiffCard tooltips stay closed. Shared with Storybook via
 * a thin CSF wrapper.
 */
export function ChangeTitleSegmentStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 480}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              unchanged index
            </Text>
            <ChangeBreadcrumb
              titlePath={['Authors', {hasMoved: false, fromIndex: 1, toIndex: 1}, 'Name']}
            />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              item added
            </Text>
            <ChangeBreadcrumb titlePath={['Authors', {hasMoved: false, toIndex: 0}]} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              item removed
            </Text>
            <ChangeBreadcrumb titlePath={['Authors', {hasMoved: false, fromIndex: 3}]} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              item moved
            </Text>
            <ChangeBreadcrumb titlePath={['Authors', {hasMoved: true, fromIndex: 4, toIndex: 1}]} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              bare segments (string, annotated added / removed / moved)
            </Text>
            <HStack gap={3}>
              <ChangeTitleSegment segment="Authors" />
              <ChangeTitleSegment segment={{hasMoved: false, toIndex: 0, annotation: ANNOTATION}} />
              <ChangeTitleSegment
                segment={{hasMoved: false, fromIndex: 3, annotation: ANNOTATION}}
              />
              <ChangeTitleSegment
                segment={{hasMoved: true, fromIndex: 1, toIndex: 4, annotation: ANNOTATION}}
              />
            </HStack>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
