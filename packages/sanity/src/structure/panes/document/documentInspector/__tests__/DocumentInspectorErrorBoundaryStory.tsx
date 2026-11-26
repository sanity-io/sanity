import {Card} from '@sanity/ui'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {DocumentInspectorErrorBoundary} from '../DocumentInspectorErrorBoundary'

const NOOP = () => undefined
const FRAME_STYLE = {width: 360, height: 280}

function ThrowingInspector(): never {
  throw new Error('Inspector failed to load')
}

/**
 * Chromatic sentinel for the inspector crash chrome after the ui5
 * Flex/Box/VStack/Text/Icon migration. A child that throws is contained
 * here instead of taking down the structure tool. The header reuses
 * DocumentInspectorHeader with locale copy; the critical card, error
 * message, and retry button are this boundary's own fallback. The
 * message is a fixture (no live inspector). Framed at the inspector
 * panel width so the header and card spacing match production.
 */
export function DocumentInspectorErrorBoundaryStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card border style={FRAME_STYLE}>
        <DocumentInspectorErrorBoundary onClose={NOOP}>
          <ThrowingInspector />
        </DocumentInspectorErrorBoundary>
      </Card>
    </TestWrapper>
  )
}
