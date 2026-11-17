import {Card} from '@sanity/ui'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {mediaLibraryUsEnglishLocaleBundle} from '../../i18n'
import {InvalidVideoWarning} from '../InvalidVideoWarning'

const NOOP = () => undefined

/**
 * Chromatic sentinel for the post-migration ui5 invalid-video caution card.
 * Pins icon alignment, caution tone, and the full-width reset button so a
 * Box token drift cannot hide the warning. Copy comes from the
 * media-library locale bundle (no live assets).
 */
export function InvalidVideoWarningStory() {
  return (
    <TestWrapper i18nBundles={[mediaLibraryUsEnglishLocaleBundle]} schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <InvalidVideoWarning onClearValue={NOOP} />
      </Card>
    </TestWrapper>
  )
}
