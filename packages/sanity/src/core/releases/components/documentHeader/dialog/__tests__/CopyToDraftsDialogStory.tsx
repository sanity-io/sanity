import noop from 'lodash-es/noop.js'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {releasesUsEnglishLocaleBundle} from '../../../../i18n'
import {CopyToDraftsDialog} from '../CopyToDraftsDialog'

/**
 * Chromatic sentinel for the copy-to-drafts override dialog after the ui5
 * Text / Dialog footer migration. Confirm + cancel sit next to body copy —
 * a mix TypeScript will not catch. Locale-fixture only; no document
 * operations, no loading spinner (that path is a transition after click).
 */
export function CopyToDraftsDialogStory() {
  return (
    <TestWrapper i18nBundles={[releasesUsEnglishLocaleBundle]} schemaTypes={[]}>
      <CopyToDraftsDialog onClose={noop} onConfirm={() => Promise.resolve()} />
    </TestWrapper>
  )
}
