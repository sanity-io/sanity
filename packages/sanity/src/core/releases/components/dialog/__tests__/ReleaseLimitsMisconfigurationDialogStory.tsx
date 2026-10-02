import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {ReleaseLimitsMisconfigurationDialog} from '../ReleaseLimitsMisconfigurationDialog'

const NOOP = () => undefined

/**
 * Chromatic sentinel for the releases misconfiguration dialog after the
 * ui5 VStack migration. Studio i18n copy only — no upsell fetch, no
 * live limits. Shared with Storybook via a thin CSF wrapper, which waits
 * for the dialog and blurs auto-focus.
 */
export function ReleaseLimitsMisconfigurationDialogStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <ReleaseLimitsMisconfigurationDialog onClose={NOOP} />
    </TestWrapper>
  )
}
