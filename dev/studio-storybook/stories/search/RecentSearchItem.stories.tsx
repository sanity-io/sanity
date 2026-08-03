import {Stack} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {useSchema} from '../../../../packages/sanity/src/core/hooks/useSchema'
import {RecentSearchItem} from '../../../../packages/sanity/src/core/studio/components/navbar/search/components/recentSearches/item/RecentSearchItem'
import {type RecentSearch} from '../../../../packages/sanity/src/core/studio/components/navbar/search/datastores/recentSearches'
import {SearchHarness, useFieldFilter, WithSearchProviders} from '../../lib/searchHarness'

// A literal, not Date.now(). A recent search renders a relative time, so a live clock would
// make this page show something different on every render and every screenshot.
const FIXED_TIMESTAMP = Date.UTC(2026, 6, 27, 9, 30)

const meta: Meta = {
  title: 'Search/Recent Search Item',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'One row of the recent-searches list has to fit a clock icon, the query text, a ' +
            'type-narrowing pill, and any filter pills onto a single line, all reconstructed ' +
            'from one stored search.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/studio/components/navbar/search/components/recentSearches/item/RecentSearchItem.tsx` |',
          '| Tier | SERVICE |',
          '| Audit | ⚪ not-audited |',
          '| Patterns | `search` |',
          '',
          'Recent Searches (see Search, Results, "Recent searches, with history") is the only ' +
            'place this mounts, always inside a list of its siblings; this page pins the row on ' +
            'its own with the value shapes that change what it shows.',
          '',
          "> **Why it matters:** the query's length is subtracted from the type pill's character " +
            'budget, so a longer query genuinely squeezes the type pill down before it squeezes ' +
            'the query text. The row is fitting two independently important pieces of information ' +
            'onto one line rather than truncating whichever comes first.',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:search', 'pattern:search', 'audit:not-audited', 'source:studio', 'tier:service'],
  decorators: [WithSearchProviders()],
}

export default meta
type Story = StoryObj

function useSchemaTypes(names: string[]) {
  const schema = useSchema()
  return names.map((name) => schema.get(name)).filter((t): t is NonNullable<typeof t> => !!t)
}

function QueryOnlyDemo() {
  const value: RecentSearch = {
    __recent: {index: 0, timestamp: FIXED_TIMESTAMP},
    query: 'release',
    types: [],
  }
  return <RecentSearchItem index={0} value={value} />
}

export const QueryOnly: Story = {
  name: 'Query text only',
  render: () => (
    <SearchHarness>
      <QueryOnlyDemo />
    </SearchHarness>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The plainest recent search: free text, no type narrowing, no filters. `value.types.length > 0` gates the type pill and `value.filters?.map(...)` gates the filter pills, so both are simply absent from the row rather than rendering as empty chips - a search this bare looks exactly as bare as it was.',
      },
    },
  },
}

function WithTypeDemo() {
  const types = useSchemaTypes(['article'])
  const value: RecentSearch = {
    __recent: {index: 0, timestamp: FIXED_TIMESTAMP},
    query: 'pricing',
    types,
  }
  return <RecentSearchItem index={0} value={value} />
}

export const QueryWithType: Story = {
  name: 'Query narrowed to a document type',
  render: () => (
    <SearchHarness>
      <WithTypeDemo />
    </SearchHarness>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '"pricing" narrowed to `Article`: the `DocumentTypesPill` in Filter Presentation now has a real caller. `availableCharacters` is computed as `maxVisibleTypePillChars - value.query.length`, so this pill has more room than the truncated example below.',
      },
    },
  },
}

function WithFiltersDemo() {
  const types = useSchemaTypes(['article'])
  const featuredFilter = useFieldFilter('featured', true)
  if (!featuredFilter) return null
  const value: RecentSearch = {
    __recent: {index: 0, timestamp: FIXED_TIMESTAMP},
    filters: [featuredFilter],
    query: 'release',
    types,
  }
  return <RecentSearchItem index={0} value={value} />
}

export const QueryWithFilters: Story = {
  name: 'Query, a type, and a filter',
  render: () => (
    <SearchHarness>
      <WithFiltersDemo />
    </SearchHarness>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The fullest row this component renders: query text, a type pill, and one `FilterPill` per entry in `value.filters`, all in the same flex-wrap row so a search with several filters wraps onto a second line rather than overflowing. Each filter pill is the exact `FilterPill` from Filter Presentation - clicking this whole row dispatches `TERMS_SET` with these filters attached, restoring the search precisely as it was saved.',
      },
    },
  },
}

function TruncatedTypesDemo() {
  const types = useSchemaTypes(['article', 'author', 'page'])
  const value: RecentSearch = {
    __recent: {index: 0, timestamp: FIXED_TIMESTAMP},
    query: 'a longer query string that eats into the available space',
    types,
  }
  return <RecentSearchItem index={0} value={value} />
}

export const LongQueryTruncatesTypes: Story = {
  name: 'A long query narrows the type pill first',
  render: () => (
    <SearchHarness>
      <Stack gap={2} style={{maxWidth: 480}}>
        <TruncatedTypesDemo />
      </Stack>
    </SearchHarness>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'All three fixture types selected, alongside a long query. `availableCharacters` goes negative before `getDocumentTypesTruncated` runs, and that function always keeps the first type regardless of length - so the pill degrades to "Article +2 more" rather than disappearing or overflowing the row, even though there is technically no room left for it at all.',
      },
    },
  },
}
