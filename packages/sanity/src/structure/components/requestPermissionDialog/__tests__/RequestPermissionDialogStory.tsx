import noop from 'lodash-es/noop.js'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {RequestPermissionDialog} from '../RequestPermissionDialog'

/**
 * Chromatic sentinel for the request-permission dialog ahead of the ui5 Flex
 * migration: body copy, the note input with its character counter, and the
 * cancel/confirm footer row. The mock client answers the roles lookup with
 * `null`, which the dialog treats as "no editor role" and falls back to
 * requesting administrator access, so the rendered copy is stable. Harness
 * for the co-located Storybook CSF file, which waits for the dialog and blurs
 * auto-focus.
 */
export function RequestPermissionDialogStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <RequestPermissionDialog onClose={noop} onRequestSubmitted={noop} />
    </TestWrapper>
  )
}
