import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {RequestPermissionDialog} from '../RequestPermissionDialog'

const noop = () => undefined

/**
 * Harness for the "ask for edit access" dialog in its initial state. The
 * mock client answers the project roles request with `null`, which the
 * dialog's `catchError` turns into the default administrator role, so
 * nothing is pending when the story settles.
 */
export function RequestPermissionDialogStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <RequestPermissionDialog onClose={noop} onRequestSubmitted={noop} />
    </TestWrapper>
  )
}
