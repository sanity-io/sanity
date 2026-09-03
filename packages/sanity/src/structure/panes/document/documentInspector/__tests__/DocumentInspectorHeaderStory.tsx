import {Card, Stack, Text} from '@sanity/ui'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {DocumentInspectorHeader} from '../DocumentInspectorHeader'

const NOOP = () => undefined

const WRAPPING_TITLE =
  'A wrapping inspector title that is long enough to wrap onto a second line in the header'

/**
 * Chromatic sentinel for the post-migration ui5 inspector header. The title
 * is a wrapping `<Text as="h1">` (no textOverflow), so a long title grows
 * the header taller rather than truncating. The children slot is unused
 * in-repo but remains public on `sanity/structure`. Titles are fixtures
 * (no live inspector).
 */
export function DocumentInspectorHeaderStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <Stack gap={5}>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              title only
            </Text>
            <DocumentInspectorHeader
              closeButtonLabel="Close inspector"
              onClose={NOOP}
              title="Validation"
            />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              wrapping title
            </Text>
            <DocumentInspectorHeader
              closeButtonLabel="Close inspector"
              onClose={NOOP}
              title={WRAPPING_TITLE}
            />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              title and slot
            </Text>
            <DocumentInspectorHeader
              closeButtonLabel="Close inspector"
              onClose={NOOP}
              title="Review changes"
            >
              <Card padding={3} tone="transparent">
                <Text muted size={1}>
                  Compare this draft with the published document.
                </Text>
              </Card>
            </DocumentInspectorHeader>
          </Stack>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
