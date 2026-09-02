import {Card, Stack, Text} from '@sanity/ui'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {DocumentInspectorHeader} from '../DocumentInspectorHeader'

const NOOP = () => undefined

/**
 * Chromatic sentinel for inspector header chrome. Main already migrated the
 * title/close gutters to ui5 Box; this snapshot pins title truncation, close
 * bleed-button alignment, and the optional children slot so a Box token
 * drift cannot hide the inspector title. Titles are fixtures (no live
 * inspector).
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
