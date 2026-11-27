import {defineField, defineType} from '@sanity/types'
import {Card, TextInput} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {type ReactNode} from 'react'
import {Flex, Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../../test/browser/TestWrapper'
import {LocaleProvider} from '../../../../../../i18n/components/LocaleProvider'
import {type WeightedHit} from '../../../../../../search/common/types'
import {SearchProvider} from '../../contexts/search/SearchProvider'
import {filterDefinitions} from '../../definitions/defaultFilters'
import {type SearchFilterDefinition} from '../../definitions/filters'
import {type FilterMenuItemFilter, type SearchFilter} from '../../types'
import {CustomTextInput} from '../common/CustomTextInput'
import {CustomTextInputBox} from '../common/CustomTextInputBox'
import {AddFilterButton} from '../filters/addFilter/AddFilterButton'
import {MenuItemFilter} from '../filters/addFilter/items/MenuItemFilter'
import {FilterPopoverWrapper} from '../filters/common/FilterPopoverWrapper'
import {DocumentTypesButton} from '../filters/documentTypes/DocumentTypesButton'
import {FilterButton} from '../filters/filter/FilterButton'
import {SearchFilterDateLastInput} from '../filters/filter/inputs/date/DateLast'
import {SearchHeader} from '../SearchHeader'
import {DebugOverlay} from '../searchResults/item/DebugOverlay'

export const searchShellSchemaTypes = [
  defineType({
    name: 'author',
    title: 'Author',
    type: 'document',
    fields: [defineField({name: 'name', title: 'Name', type: 'string'})],
  }),
  defineType({
    name: 'article',
    title: 'Article',
    type: 'document',
    fields: [defineField({name: 'title', title: 'Title', type: 'string'})],
  }),
]

const foundUpdatedAtFilter = filterDefinitions.find((definition) => definition.name === 'updatedAt')
if (!foundUpdatedAtFilter) {
  throw new Error('Expected the built-in updatedAt search filter')
}
const updatedAtFilterDefinition: SearchFilterDefinition = foundUpdatedAtFilter

const UPDATED_AT_LAST_WEEK: SearchFilter = {
  filterName: 'updatedAt',
  operatorType: 'dateTimeLast',
  value: {unit: 'day', unitValue: 7},
}

const UPDATED_AT_MENU_ITEM: FilterMenuItemFilter = {
  filter: {filterName: 'updatedAt', operatorType: 'dateTimeLast'},
  filterDefinition: updatedAtFilterDefinition,
  type: 'filter',
}

const STRONG_HIT: WeightedHit = {
  hit: {_id: 'article-1', _type: 'article'},
  resultIndex: 0,
  score: 0.8,
  stories: [
    {path: 'title', score: 0.8, why: 'Exact match'},
    {path: 'body', score: 0, why: 'No match'},
  ],
}

const WEAK_HIT: WeightedHit = {
  hit: {_id: 'article-2', _type: 'article'},
  resultIndex: 1,
  score: 0.05,
  stories: [],
}

function Section({children, title}: {children: ReactNode; title: string}) {
  return (
    <VStack gap={2}>
      <Text muted size={1} weight="medium" as="div" trim={true}>
        {title}
      </Text>
      {children}
    </VStack>
  )
}

/**
 * Chromatic sentinel for the global search shell, rendered on a fixture schema
 * (author, article) with no live queries: the compact and fullscreen search
 * headers (styled spinner, filter toggle), the custom text input box behind
 * the header's input, the filter toolbar buttons (document types, add filter,
 * an "Edited at: last 7 days" filter pill), the add-filter menu row, the popover
 * wrapper card, the "last N units" date operator input and the debug score
 * overlays. The result preview rows are left out: they subscribe to the
 * document preview store, which queries the mock client. `TestWrapper` mounts
 * no locale provider, and the date filter formats relative times, so the
 * studio `LocaleProvider` sits on top of the mock source.
 */
export function SearchShellStory() {
  return (
    <TestWrapper schemaTypes={searchShellSchemaTypes}>
      <LocaleProvider>
        <Card padding={4} style={{maxWidth: 640}}>
          <VStack gap={5}>
            <Section title="compact header">
              <SearchProvider>
                <Card border radius={2}>
                  <SearchHeader onClose={noop} />
                </Card>
              </SearchProvider>
            </Section>
            <Section title="fullscreen header">
              <SearchProvider fullscreen>
                <Card border radius={2}>
                  <SearchHeader onClose={noop} ariaInputLabel="Search documents" />
                </Card>
              </SearchProvider>
            </Section>
            <Section title="custom text input">
              <CustomTextInputBox $background $smallClearButton>
                <TextInput clearButton onClear={noop} readOnly value="shaded box" />
              </CustomTextInputBox>
              <CustomTextInput border={false} readOnly value="transparent box" />
            </Section>
            <Section title="filter toolbar">
              <SearchProvider>
                <Flex gap={2} flexWrap="wrap">
                  <DocumentTypesButton />
                  <FilterButton filter={UPDATED_AT_LAST_WEEK} />
                  <AddFilterButton />
                </Flex>
              </SearchProvider>
            </Section>
            <Section title="filter menu item and popover wrapper">
              <SearchProvider>
                <FilterPopoverWrapper onClose={noop}>
                  <Card padding={1} style={{width: 240}}>
                    <MenuItemFilter item={UPDATED_AT_MENU_ITEM} onClose={noop} />
                  </Card>
                </FilterPopoverWrapper>
              </SearchProvider>
            </Section>
            <Section title="date last input">
              <SearchProvider>
                <SearchFilterDateLastInput onChange={noop} value={{unit: 'day', unitValue: 7}} />
              </SearchProvider>
            </Section>
            <Section title="debug overlays">
              <Flex gap={3}>
                <DebugOverlay data={STRONG_HIT} />
                <DebugOverlay data={WEAK_HIT} />
              </Flex>
            </Section>
          </VStack>
        </Card>
      </LocaleProvider>
    </TestWrapper>
  )
}
