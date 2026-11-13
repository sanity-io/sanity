import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../../../../test/browser/TestWrapper'
import {SearchProvider} from '../../../../contexts/search/SearchProvider'
import {type SearchFilter} from '../../../../types'
import {FilterTitle} from '../../../common/FilterTitle'
import {SearchFilterNumberRangeInput} from '../../filter/inputs/number/NumberRange'
import {FilterDetails} from '../FilterDetails'
import {FilterPopoverContentHeader} from '../FilterPopoverContentHeader'

const NOOP = () => undefined

const SEARCH_SCHEMA = [
  {
    fields: [
      {name: 'title', type: 'boolean'},
      {name: 'count', type: 'number'},
      {
        fields: [{name: 'title', type: 'boolean'}],
        name: 'seo',
        title: 'SEO',
        type: 'object',
      },
    ],
    name: 'article',
    type: 'document',
  },
]

const NESTED_BOOLEAN_FILTER: SearchFilter = {
  fieldId: 'boolean-seo.title-Title',
  filterName: 'boolean',
  operatorType: 'booleanEqual',
  value: true,
}

const TOP_BOOLEAN_FILTER: SearchFilter = {
  fieldId: 'boolean-title-Title',
  filterName: 'boolean',
  operatorType: 'booleanEqual',
  value: true,
}

/**
 * Chromatic sentinel for global-search filter chrome migrated to ui5 Flex/Box:
 * the popover search header (empty vs typed + clear), FilterDetails path
 * breadcrumbs, FilterTitle truncation, and the number-range inputs. Mix of
 * Card/TextInput padding against ui5 Flex is invisible to TypeScript. Copy
 * comes from the studio locale bundle (no queries, no dates).
 */
export function SearchFilterChromeStory() {
  return (
    <TestWrapper schemaTypes={SEARCH_SCHEMA}>
      <Card padding={4} style={{maxWidth: 420}}>
        <SearchProvider>
          <VStack gap={5}>
            <VStack gap={2}>
              <Text muted size={1} weight="medium">
                header empty
              </Text>
              <FilterPopoverContentHeader
                ariaInputLabel="Filter types"
                onChange={NOOP}
                onClear={NOOP}
                typeFilter=""
              />
            </VStack>
            <VStack gap={2}>
              <Text muted size={1} weight="medium">
                header with query
              </Text>
              <FilterPopoverContentHeader
                ariaInputLabel="Filter types"
                onChange={NOOP}
                onClear={NOOP}
                typeFilter="Author"
              />
            </VStack>
            <VStack gap={2}>
              <Text muted size={1} weight="medium">
                details nested path
              </Text>
              <FilterDetails filter={NESTED_BOOLEAN_FILTER} />
            </VStack>
            <VStack gap={2}>
              <Text muted size={1} weight="medium">
                details field only
              </Text>
              <FilterDetails filter={TOP_BOOLEAN_FILTER} />
            </VStack>
            <VStack gap={2}>
              <Text muted size={1} weight="medium">
                filter title
              </Text>
              <Text size={1}>
                <FilterTitle filter={NESTED_BOOLEAN_FILTER} />
              </Text>
            </VStack>
            <VStack gap={2}>
              <Text muted size={1} weight="medium">
                filter title truncated
              </Text>
              <Text size={1}>
                <FilterTitle filter={NESTED_BOOLEAN_FILTER} maxLength={4} />
              </Text>
            </VStack>
            <VStack gap={2}>
              <Text muted size={1} weight="medium">
                number range empty
              </Text>
              <SearchFilterNumberRangeInput onChange={NOOP} value={{from: null, to: null}} />
            </VStack>
            <VStack gap={2}>
              <Text muted size={1} weight="medium">
                number range filled
              </Text>
              <SearchFilterNumberRangeInput onChange={NOOP} value={{from: 2, to: 10}} />
            </VStack>
          </VStack>
        </SearchProvider>
      </Card>
    </TestWrapper>
  )
}
