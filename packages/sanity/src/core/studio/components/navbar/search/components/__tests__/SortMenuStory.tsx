import {Card} from '@sanity/ui'

import {TestWrapper} from '../../../../../../../../test/browser/TestWrapper'
import {SearchProvider} from '../../contexts/search/SearchProvider'
import {SortMenu} from '../SortMenu'

const SCHEMA_TYPES: [] = []

/**
 * Chromatic sentinel for the global-search sort menu after the ui5 Flex
 * migration. SearchProvider supplies the default "Best match" ordering.
 * Play opens the menu so the snapshot is the portaled list (relevance plus
 * created/updated directions), not just the bleed trigger. Studio locale
 * copy; no live search.
 */
export function SortMenuStory() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <Card style={{minHeight: 320, width: 360}}>
        <SearchProvider>
          <SortMenu />
        </SearchProvider>
      </Card>
    </TestWrapper>
  )
}
