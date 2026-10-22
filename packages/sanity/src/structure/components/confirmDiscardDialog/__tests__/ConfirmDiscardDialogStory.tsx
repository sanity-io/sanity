import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {ConfirmDiscardDialog} from '../ConfirmDiscardDialog'

const NOOP = () => undefined

export type ConfirmDiscardDialogStoryMode = 'published' | 'draft'

/**
 * Chromatic sentinel for the structure discard-changes confirm dialog.
 * Published vs draft-only body copy sit next to the default Dialog footer
 * confirm row — a mix TypeScript will not catch. Copy is locale-fixture
 * only; no live document, no timestamps.
 */
export function ConfirmDiscardDialogStory(props: {mode: ConfirmDiscardDialogStoryMode}) {
  return (
    <TestWrapper schemaTypes={[]}>
      <ConfirmDiscardDialog
        onCancel={NOOP}
        onConfirm={NOOP}
        publishedExists={props.mode === 'published'}
      />
    </TestWrapper>
  )
}
