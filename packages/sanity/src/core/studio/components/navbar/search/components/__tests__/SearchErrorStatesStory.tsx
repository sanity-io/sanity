import {Card, Stack, Text} from '@sanity/ui'

import {TestWrapper} from '../../../../../../../../test/browser/TestWrapper'
import {FilterError} from '../filters/filter/FilterError'
import {AssetSourceError} from '../filters/filter/inputs/asset/AssetSourceError'
import {SearchError} from '../SearchError'

/**
 * Chromatic sentinel for navbar search/filter error chrome migrated to ui5
 * Box. Critical SearchError/FilterError and caution AssetSourceError all
 * pair Box padding with TextWithTone — a mix a type-check will not catch.
 * Copy comes from the default studio locale bundle (no timestamps).
 * Padding matches production: FilterError in FilterForm (4), AssetSourceError
 * in Asset (2). SearchError hardcodes its own padding.
 */
export function SearchErrorStatesStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <Stack gap={5}>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              search error
            </Text>
            <SearchError />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              filter error
            </Text>
            <FilterError padding={4} />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              asset source error
            </Text>
            <AssetSourceError padding={2} />
          </Stack>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
