import {type SanityDocument} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {LinkToCanvasDiff} from '../LinkToCanvasDiff'

const DRAFT: SanityDocument = {
  _id: 'drafts.story-canvas-doc',
  _type: 'author',
  _rev: 'rev1',
  _createdAt: '2026-01-01T00:00:00.000Z',
  _updatedAt: '2026-01-01T00:00:00.000Z',
}

/**
 * Chromatic sentinel for the canvas link-confirm warning: ui5 Box padding on
 * the critical card and draft/published version chips. Mapped document is
 * omitted so DocumentDiff (schema-dependent) is not rendered. Motion fade-in
 * is past Chromatic's delay. Shared with Storybook via a thin CSF wrapper.
 */
export function LinkToCanvasDiffStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 480}}>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            draft to published chips
          </Text>
          <LinkToCanvasDiff originalDocument={DRAFT} mappedDocument={undefined} />
        </Stack>
      </Card>
    </TestWrapper>
  )
}
