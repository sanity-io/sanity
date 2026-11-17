import noop from 'lodash-es/noop.js'

import {TestWrapper} from '../../../../../../../../test/browser/TestWrapper'
import {SearchProvider} from '../../contexts/search/SearchProvider'
import {SearchPopover} from '../SearchPopover'
import {searchShellSchemaTypes} from './SearchShellStory'

/**
 * Chromatic sentinel for the open global search popover (the non-fullscreen
 * search surface): the motion overlay and card, the header input, the filter
 * row (document types, add filter) and the empty recent searches instructions.
 * Focus lock is off so the story does not steal focus from the canvas. Fixture
 * schema only; no query is typed, so no search runs.
 */
export function SearchPopoverStory() {
  return (
    <TestWrapper schemaTypes={searchShellSchemaTypes}>
      <SearchProvider>
        <SearchPopover disableFocusLock onClose={noop} open />
      </SearchProvider>
    </TestWrapper>
  )
}
