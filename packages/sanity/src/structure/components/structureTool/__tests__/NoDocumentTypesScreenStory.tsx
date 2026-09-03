import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {NoDocumentTypesScreen} from '../NoDocumentTypesScreen'

/**
 * Chromatic sentinel for the empty structure tool screen ahead of the ui5
 * Flex migration: the fill-height centering Flex around the caution card and
 * the icon-plus-copy row inside it. The fixed-height frame stands in for the
 * tool root the screen normally fills. Locale copy only.
 */
export function NoDocumentTypesScreenStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <div style={{height: 480}}>
        <NoDocumentTypesScreen />
      </div>
    </TestWrapper>
  )
}
