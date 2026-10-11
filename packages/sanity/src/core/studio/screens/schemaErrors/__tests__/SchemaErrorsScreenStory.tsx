import {type Schema} from '@sanity/types'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {SchemaErrorsScreen} from '../SchemaErrorsScreen'

const SCHEMA = {
  name: 'test',
  _validation: [
    {
      path: [
        {kind: 'type', type: 'document', name: 'mediaGalleryItem'},
        {kind: 'property', name: 'fields'},
        {kind: 'type', type: 'reference', name: 'article'},
      ],
      problems: [{severity: 'error', message: 'Unknown type: article.'}],
    },
  ],
} as unknown as Schema

/**
 * Chromatic sentinel for the error location card. The screen renders from an
 * error boundary that can sit either side of LocaleProvider, so every label
 * carries an inline default; this story renders through TestWrapper, which
 * mounts no LocaleProvider, and so pins the untranslated path.
 */
export function SchemaErrorsScreenStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <SchemaErrorsScreen
        schema={SCHEMA}
        context={{
          workspaceName: 'media-gallery',
          sourceName: 'secondary',
          projectId: 'ppsg7ml5',
          dataset: 'playground',
        }}
      />
    </TestWrapper>
  )
}
