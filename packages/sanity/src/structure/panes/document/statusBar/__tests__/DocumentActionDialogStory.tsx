import {Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {ModalDialog} from '../dialogs/ModalDialog'

const DIALOG = {
  type: 'dialog' as const,
  header: 'Publish document',
  content: <Text size={1}>Ready to publish Article. This cannot be undone from the action.</Text>,
  footer: <Text size={1}>Publishes the current draft</Text>,
  onClose: noop,
  width: 'medium' as const,
}

/**
 * Chromatic sentinel for the document-action modal after the ui5 Box
 * migration. ModalDialog pads the content and footer slots with Box — a mix
 * TypeScript will not catch. Fixture copy only (no live action). Shared with
 * the co-located Storybook CSF file, which waits for the dialog and blurs
 * auto-focus.
 */
export function DocumentActionDialogStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <ModalDialog dialog={DIALOG} />
    </TestWrapper>
  )
}
