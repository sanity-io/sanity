import noop from 'lodash-es/noop.js'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {searchShellSchemaTypes} from '../components/__tests__/SearchShellStory'
import {SearchProvider} from '../contexts/search/SearchProvider'
import {SearchDialog} from '../SearchDialog'

/**
 * Chromatic sentinel for the fullscreen (small viewport) search dialog: the
 * fixed full-size box with its inner card, the fullscreen header (back button,
 * shaded input, filter toggle) and the empty recent searches instructions.
 * Fixture schema only; no query is typed, so no search runs.
 */
export function SearchDialogStory() {
  return (
    <TestWrapper schemaTypes={searchShellSchemaTypes}>
      <SearchProvider fullscreen>
        <SearchDialog onClose={noop} onOpen={noop} open />
      </SearchProvider>
    </TestWrapper>
  )
}
