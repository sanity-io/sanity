import {Card, Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {type ConditionFacet} from '../../util'
import {VariantConditionFilters} from '../VariantConditionFilters'

const FACETS: ConditionFacet[] = [
  {key: 'audience', values: ['alpha', 'loyal']},
  {key: 'locale', values: ['en-US', 'nb-NO']},
]

const ACTIVE_VALUE: Record<string, string[]> = {
  audience: ['alpha'],
  locale: ['en-US'],
}

/**
 * Chromatic sentinel for the variants overview filter bar after the ui5 Text
 * and Icon migration. The compact empty bar, primary chips, and clear control
 * all sit in one Flex row — spacing and chip tone TypeScript will not catch.
 * Facets and values are fixtures; no live variant list.
 */
export function VariantConditionFiltersBarStory() {
  return (
    <TestWrapper i18nBundles={[variantsUsEnglishLocaleBundle]} schemaTypes={[]}>
      <Card padding={4}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              empty
            </Text>
            <VariantConditionFilters facets={FACETS} onChange={noop} value={{}} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              chips
            </Text>
            <VariantConditionFilters facets={FACETS} onChange={noop} value={ACTIVE_VALUE} />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}

/**
 * Same filter bar with chips, opened to the add-filter popover. Opening
 * selects the first dimension so the value pane shows checkmarks for the
 * already-active audience. Play waits for the locale bundle, then opens.
 */
export function VariantConditionFiltersMenuStory() {
  return (
    <TestWrapper i18nBundles={[variantsUsEnglishLocaleBundle]} schemaTypes={[]}>
      <Card padding={4} style={{minHeight: 360}}>
        <VariantConditionFilters facets={FACETS} onChange={noop} value={ACTIVE_VALUE} />
      </Card>
    </TestWrapper>
  )
}
