import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {ConfirmDiscardDialog} from '../ConfirmDiscardDialog'

const noop = () => undefined

/**
 * Harness for the discard-changes confirmation dialog with a published
 * version present, so the "since last published" copy renders.
 */
export function ConfirmDiscardDialogStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <ConfirmDiscardDialog onCancel={noop} onConfirm={noop} publishedExists />
    </TestWrapper>
  )
}
