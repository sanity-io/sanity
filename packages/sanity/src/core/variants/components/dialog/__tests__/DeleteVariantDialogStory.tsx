import noop from 'lodash-es/noop.js'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {DeleteVariantDialog} from '../DeleteVariantDialog'

export type DeleteVariantDialogStoryMode = 'idle' | 'deleting'

/**
 * Chromatic sentinel for the delete-variant confirm dialog after the ui5
 * Text / Dialog footer migration. Critical confirm sits next to muted body
 * copy — a mix TypeScript will not catch. Idle vs deleting (loading confirm,
 * disabled cancel). Fixture title only; no variant store.
 */
export function DeleteVariantDialogStory(props: {mode: DeleteVariantDialogStoryMode}) {
  const isDeleting = props.mode === 'deleting'

  return (
    <TestWrapper i18nBundles={[variantsUsEnglishLocaleBundle]} schemaTypes={[]}>
      <DeleteVariantDialog
        isDeleting={isDeleting}
        onClose={noop}
        onConfirm={noop}
        variantTitle="Summer collection"
      />
    </TestWrapper>
  )
}
