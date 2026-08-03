import {Box, Card, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {AddFilterPopoverContent} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/addFilter/AddFilterPopoverContent'
import {FilterTooltip} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/addFilter/items/FilterTooltip'
import {MenuItemFilter} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/addFilter/items/MenuItemFilter'
import {MenuItemHeader} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/addFilter/items/MenuItemHeader'
import {useSearchState} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/contexts/search/useSearchState'
import {getFilterDefinition} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/definitions/filters'
import {type FilterMenuItemFilter} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/types'
import {
  buildSearchFilter,
  getFieldFromFilter,
} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/utils/filterUtils'
import {SearchHarness, SeedSearchState, WithSearchProviders} from '../../../lib/searchHarness'

const meta: Meta = {
  title: 'Search/Add Filter Menu',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Behind the Add Filter button sits a search box over a schema-derived list, built ' +
            'from a group header, a filter row that disables itself once already active, and a ' +
            'tooltip that explains a filter before it is chosen.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/studio/components/navbar/search/components/filters/addFilter/` (`AddFilterPopoverContent.tsx`, `items/MenuItemFilter.tsx`, `items/MenuItemHeader.tsx`, `items/FilterTooltip.tsx`) |',
          '| Tier | SERVICE |',
          '| Audit | ⚪ not-audited |',
          '| Patterns | `filters` |',
          '',
          '> **Why it matters:** the menu is not configured, it is derived. Every row is walked ' +
            'from the active workspace schema, so adding a filterable field to a schema makes a ' +
            'row for it appear here unasked. See Filter Shell, Add-filter popover open and ' +
            'narrowed, for the same content reached by clicking the real trigger and typing into ' +
            'it.',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:search', 'pattern:filters', 'audit:not-audited', 'source:studio', 'tier:service'],
  decorators: [WithSearchProviders()],
}

export default meta
type Story = StoryObj

export const Ungrouped: Story = {
  name: 'AddFilterPopoverContent, no type narrowed',
  render: () => (
    <SearchHarness>
      <Card border radius={2} style={{width: 300}}>
        <AddFilterPopoverContent onClose={() => undefined} />
      </Card>
    </SearchHarness>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'With no document type narrowed, `createFilterMenuItems` returns one flat group: the pinned filters (Edited at, Created at, Contains document/image/file) followed by every field across every fixture document type under a single "All fields" header - there is nothing yet to group by.',
      },
    },
  },
}

export const NarrowedToOneType: Story = {
  name: 'AddFilterPopoverContent, narrowed to Article',
  render: () => (
    <SearchHarness>
      <SeedSearchState types={['article']} />
      <Card border radius={2} style={{width: 300}}>
        <AddFilterPopoverContent onClose={() => undefined} />
      </Card>
    </SearchHarness>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The same content once search is narrowed to `Article`: the field list now groups by which document types share a field, so fields unique to `Author` and `Page` drop out of the "shared" view. This is the same `documentTypesNarrowed` state that Document Types Menu narrows, seen from the other control that reads it.',
      },
    },
  },
}

function useMenuItemFixtures() {
  const {
    state: {definitions},
  } = useSearchState()
  const titleFieldDef = Object.values(definitions.fields).find((f) => f.fieldPath === 'title')
  const featuredFieldDef = Object.values(definitions.fields).find((f) => f.fieldPath === 'featured')
  if (!titleFieldDef || !featuredFieldDef) return null

  const titleFilterDef = getFilterDefinition(definitions.filters, titleFieldDef.filterName)
  const featuredFilterDef = getFilterDefinition(definitions.filters, featuredFieldDef.filterName)
  if (!titleFilterDef || !featuredFilterDef) return null

  const titleItem: FilterMenuItemFilter = {
    fieldDefinition: getFieldFromFilter(
      definitions.fields,
      buildSearchFilter(titleFilterDef, titleFieldDef.id),
    ),
    filterDefinition: titleFilterDef,
    filter: buildSearchFilter(titleFilterDef, titleFieldDef.id),
    type: 'filter',
  }
  const featuredItem: FilterMenuItemFilter = {
    fieldDefinition: getFieldFromFilter(
      definitions.fields,
      buildSearchFilter(featuredFilterDef, featuredFieldDef.id),
    ),
    filterDefinition: featuredFilterDef,
    filter: buildSearchFilter(featuredFilterDef, featuredFieldDef.id),
    type: 'filter',
  }
  return {titleItem, featuredItem}
}

export const MenuItems: Story = {
  name: 'MenuItemHeader and MenuItemFilter',
  render: () => {
    function Demo() {
      const fixtures = useMenuItemFixtures()
      if (!fixtures) return null
      return (
        <Card border radius={2} style={{width: 300}}>
          <MenuItemHeader item={{title: 'All fields', type: 'header'}} />
          <MenuItemFilter item={fixtures.titleItem} onClose={() => undefined} paddingBottom={1} />
          <MenuItemFilter
            item={fixtures.featuredItem}
            onClose={() => undefined}
            paddingBottom={1}
          />
        </Card>
      )
    }
    return (
      <SearchHarness>
        <Demo />
      </SearchHarness>
    )
  },
  parameters: {
    docs: {
      description: {
        story:
          "A header row above two filter rows, outside the `CommandList` that normally virtualizes them. `MenuItemFilter` disables itself (`isAlreadyActive`) once a filter with the same key is already on the bar - neither row here is active, so both stay clickable; add the same field from Filter Shell's filter bar and this exact row would grey out.",
      },
    },
  },
}

export const MenuItemActive: Story = {
  name: 'MenuItemFilter, already active',
  render: () => {
    function Demo() {
      const fixtures = useMenuItemFixtures()
      if (!fixtures) return null
      return (
        <>
          <SeedSearchState filters={[fixtures.titleItem.filter]} />
          <Card border radius={2} style={{width: 300}}>
            <MenuItemFilter item={fixtures.titleItem} onClose={() => undefined} paddingBottom={1} />
          </Card>
        </>
      )
    }
    return (
      <SearchHarness>
        <Demo />
      </SearchHarness>
    )
  },
  parameters: {
    docs: {
      description: {
        story:
          'The same Title row, but the identical filter is seeded into `state.filters` first, so `getFilterKey` finds a match and `isAlreadyActive` disables the button - clicking it would add a second, redundant copy of a filter already on the bar, so the menu prevents that rather than letting a person discover it by trying.',
      },
    },
  },
}

export const Tooltip: Story = {
  name: 'FilterTooltip',
  render: () => {
    function Demo() {
      const {
        state: {definitions},
      } = useSearchState()
      const fieldDef = Object.values(definitions.fields).find((f) => f.fieldPath === 'summary')
      if (!fieldDef) return null
      const filterDef = getFilterDefinition(definitions.filters, fieldDef.filterName)
      if (!filterDef) return null
      return (
        <FilterTooltip fieldDefinition={fieldDef} filterDefinition={filterDef} visible>
          <Card border padding={4} radius={2} style={{width: 160, textAlign: 'center'}}>
            <Text size={1}>Hover target</Text>
          </Card>
        </FilterTooltip>
      )
    }
    return (
      <SearchHarness>
        <Box padding={6}>
          <Demo />
        </Box>
      </SearchHarness>
    )
  },
  parameters: {
    docs: {
      description: {
        story:
          'The tooltip `MenuItemFilter` wraps every row in, forced open with `visible` so it renders without a hover. `summary` is a `text` field present only on `Article`, so this is the case with the most content: the field\'s raw name (monospaced), and the list of document types it is used in, truncated past ten with a "+N more" suffix the same way `DocumentTypesPill` truncates. A field with no description and only one document type would show a shorter tooltip - this row was chosen to show every section at once, not because it is typical.',
      },
    },
  },
}
