import {Card} from '@sanity/ui'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {InvalidVideoWarning} from '../InvalidVideoWarning'

const NOOP = () => undefined

/**
 * Chromatic sentinel for the invalid-video caution card. Main already
 * swapped the icon gutter to ui5 Box; this snapshot pins icon alignment,
 * caution tone, and the full-width reset button so that migration cannot
 * drift without a visual diff. Copy comes from the media-library locale
 * bundle (no live assets).
 */
export function InvalidVideoWarningStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <InvalidVideoWarning onClearValue={NOOP} />
      </Card>
    </TestWrapper>
  )
}
