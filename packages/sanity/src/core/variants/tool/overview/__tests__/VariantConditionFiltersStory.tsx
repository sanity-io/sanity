import {Card, Stack, Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {type ConditionFacet} from '../../util'
import {VariantConditionFilters} from '../VariantConditionFilters'

export const FACETS: ConditionFacet[] = [
  {key: 'audience', values: ['alpha', 'beta']},
  {key: 'locale', values: ['en-US', 'nb-NO']},
  {key: 'market', values: ['nordics']},
]

const ACTIVE_VALUE: Record<string, string[]> = {audience: ['alpha'], locale: ['en-US', 'nb-NO']}

/**
 * Chromatic sentinel for the variants-overview filter bar: the compact
 * inline-flex bar with only the "Add filter" entry point, and the lane-filling
 * bar with the thin rule, one primary chip per active value (dimension icon,
 * value, remove button) and the "Clear filters" action pinned right. The
 * add-filter popover is opened by the CSF `play`, not here.
 */
export function VariantConditionFiltersStory() {
  return (
    <TestWrapper i18nBundles={[variantsUsEnglishLocaleBundle]} schemaTypes={[]}>
      <Card padding={4}>
        <Stack gap={5}>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              no active filters (compact)
            </Text>
            <VariantConditionFilters facets={FACETS} onChange={noop} value={{}} />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              active chips and clear action
            </Text>
            <VariantConditionFilters facets={FACETS} onChange={noop} value={ACTIVE_VALUE} />
          </Stack>
        </Stack>
      </Card>
    </TestWrapper>
  )
}

/**
 * Single compact bar, used by the CSF `play` story that opens the add-filter
 * popover (dimension list left, first dimension's values right).
 */
export function VariantConditionFiltersMenuStory() {
  return (
    <TestWrapper i18nBundles={[variantsUsEnglishLocaleBundle]} schemaTypes={[]}>
      <Card padding={4} style={{minHeight: 360}}>
        <VariantConditionFilters facets={FACETS} onChange={noop} value={{audience: ['alpha']}} />
      </Card>
    </TestWrapper>
  )
}
