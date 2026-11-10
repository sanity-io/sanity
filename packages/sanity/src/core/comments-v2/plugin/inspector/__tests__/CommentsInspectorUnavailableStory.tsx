import {Card} from '@sanity/ui'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {commentsUsEnglishLocaleBundle} from '../../../i18n'
import {CommentsInspectorUnavailable} from '../CommentsInspectorUnavailable'

const NOOP = () => undefined

/**
 * The comments inspector after a failed feature check: the header row with the feature name and
 * close control, and the "unavailable" message below it. Framed at the inspector panel's width
 * so the header padding and message spacing are what gets snapshotted; copy is locale-fixture
 * only and nothing in it loads.
 */
export function CommentsInspectorUnavailableStory() {
  return (
    <TestWrapper i18nBundles={[commentsUsEnglishLocaleBundle]} schemaTypes={[]}>
      <Card border style={{width: 360, height: 240}}>
        <CommentsInspectorUnavailable onClose={NOOP} />
      </Card>
    </TestWrapper>
  )
}
