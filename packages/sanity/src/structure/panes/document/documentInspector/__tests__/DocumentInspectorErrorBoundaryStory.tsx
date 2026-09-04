import {Card, Stack, Text} from '@sanity/ui'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {DocumentInspectorErrorBoundary} from '../DocumentInspectorErrorBoundary'

const NOOP = () => undefined

function ThrowingInspector(): never {
  throw new Error('Inspector plugin failed to resolve the selected document.')
}

/**
 * Chromatic sentinel for the document inspector crash chrome after the
 * ui5 Flex/Box migration. The boundary swaps the inspector for a critical
 * card, muted error message, and retry button — spacing TypeScript will
 * not catch. The message is a fixture (no stack).
 */
export function DocumentInspectorErrorBoundaryStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{height: 320, maxWidth: 420}}>
        <Stack gap={2} height="fill">
          <Text muted size={1} weight="medium">
            caught render error
          </Text>
          <DocumentInspectorErrorBoundary onClose={NOOP}>
            <ThrowingInspector />
          </DocumentInspectorErrorBoundary>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
