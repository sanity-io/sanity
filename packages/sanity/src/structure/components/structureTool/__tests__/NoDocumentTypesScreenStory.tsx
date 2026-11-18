import {Card} from '@sanity/ui'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {NoDocumentTypesScreen} from '../NoDocumentTypesScreen'

const FRAME_STYLE = {height: 320}

/**
 * Chromatic sentinel for the empty-schema structure screen after the ui5
 * Flex/Box/Text/Link migration. Caution tone, warning icon, and docs link
 * sit in a centered fill-height Card — a mix TypeScript will not catch.
 * Copy comes from the structure locale bundle already on TestWrapper.
 */
export function NoDocumentTypesScreenStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4}>
        <div style={FRAME_STYLE}>
          <NoDocumentTypesScreen />
        </div>
      </Card>
    </TestWrapper>
  )
}
