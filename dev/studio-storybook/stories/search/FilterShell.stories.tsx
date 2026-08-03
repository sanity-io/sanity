import {Card, Flex} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ReactNode, useEffect} from 'react'
import {userEvent, within} from 'storybook/test'

import {AddFilterButton} from '../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/addFilter/AddFilterButton'
import {DocumentTypesButton} from '../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/documentTypes/DocumentTypesButton'
import {Filters} from '../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/Filters'
import {SearchHeader} from '../../../../packages/sanity/src/core/studio/components/navbar/search/components/SearchHeader'
import {SortMenu} from '../../../../packages/sanity/src/core/studio/components/navbar/search/components/SortMenu'
import {useSearchState} from '../../../../packages/sanity/src/core/studio/components/navbar/search/contexts/search/useSearchState'
import {getFilterDefinition} from '../../../../packages/sanity/src/core/studio/components/navbar/search/definitions/filters'
import {buildSearchFilter} from '../../../../packages/sanity/src/core/studio/components/navbar/search/utils/filterUtils'
import {SearchHarness, SeedSearchState, WithSearchProviders} from '../../lib/searchHarness'

const meta: Meta = {
  title: 'Search/Filter Shell',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          'Building a filter has its own chrome, separate from the filters it holds: the bar, ' +
            'the button that adds one, document-type narrowing, and the query field and sort ' +
            'control that sit beside it.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/studio/components/navbar/search/components/` |',
          '| Tier | SERVICE |',
          '| Audit | ⚪ not-audited |',
          '| Patterns | `filters` |',
          '| Harness | closed states seeded straight into the reducer; open-popover states driven by a `play` function clicking the real trigger button |',
          '',
          'The operator-specific value inputs (string, number, date, and the rest) are catalogued ' +
            'separately under Filter Inputs; this page is everything around them. Closed states ' +
            'seed straight into the reducer with `SeedSearchState`, plus a small local ' +
            '`SeedFieldFilters` that resolves a field filter by path against the live, ' +
            'schema-derived definitions rather than a guessed id. Open-popover states are driven ' +
            'by a `play` function that clicks the real trigger button, because `AddFilterButton`, ' +
            '`DocumentTypesButton` and `SortMenu` all manage their own open state internally and ' +
            'take no controlled prop from outside.',
          '',
          '> **Why it matters:** the add-filter menu is not configured anywhere. It is derived ' +
            'from the schema every time it opens, walking field definitions that are themselves ' +
            'built out of the workspace schema. What a studio can filter by is a consequence of ' +
            'how it was modelled, not a list someone maintains by hand.',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:search', 'pattern:filters', 'audit:not-audited', 'source:studio', 'tier:service'],
}

export default meta
type Story = StoryObj

/**
 * A plain frame to stand a shell component on: enough width for its popover to have somewhere
 * to open, enough height that a tall popover (the add-filter field list, in particular) has room
 * to render without the story canvas clipping it.
 */
function Stage({
  children,
  minHeight = 420,
  width = 640,
}: {
  children: ReactNode
  minHeight?: number
  width?: number
}) {
  return (
    <Flex padding={4} style={{minHeight}}>
      <Card border radius={2} style={{width}}>
        {children}
      </Card>
    </Flex>
  )
}

/**
 * Seed one or more field filters, resolved by field path against the live definitions the
 * `SearchProvider` builds from the fixture schema on mount.
 *
 * A field's id is a hash of its type, path and title (`generateFieldId`), not something a story
 * can write down in advance, so this looks the field up the same way `createFilterMenuItems`
 * does and builds the filter with the real `buildSearchFilter` helper rather than hand-assembling
 * a `SearchFilter` object and hoping the id lines up.
 */
function SeedFieldFilters({
  fields,
  autoOpenLast = false,
}: {
  fields: {fieldPath: string; value: unknown}[]
  /**
   * Whether to leave the last-added filter's value editor open.
   *
   * `Filters` gives `initialOpen` to whichever filter matches `lastAddedFilter`, which is the right
   * behaviour in the product: after picking a filter from the Add Filter menu you land straight in
   * "now set a value". But a story that seeds filters at mount inherits that nudge for free, and an
   * auto-opened popover sitting over the document-types button reads as a rendering bug rather than
   * a behaviour. So it is opt-in here: `false` finishes with `TERMS_SET`, the one action that
   * clears `lastAddedFilter`, leaving a quiet bar.
   */
  autoOpenLast?: boolean
}) {
  const {dispatch, state} = useSearchState()
  useEffect(() => {
    const built = []
    for (const {fieldPath, value} of fields) {
      const fieldDefinition = Object.values(state.definitions.fields).find(
        (field) => field.fieldPath === fieldPath,
      )
      if (!fieldDefinition) continue
      const filterDefinition = getFilterDefinition(
        state.definitions.filters,
        fieldDefinition.filterName,
      )
      if (!filterDefinition) continue
      const filter = {...buildSearchFilter(filterDefinition, fieldDefinition.id), value}
      built.push(filter)
      dispatch({type: 'TERMS_FILTERS_ADD', filter})
    }
    if (!autoOpenLast && built.length) {
      dispatch({type: 'TERMS_SET', terms: state.terms, filters: built})
    }
    // mount-only: seeds an initial state, mirrors SeedSearchState
    // oxlint-disable-next-line exhaustive-deps
  }, [])
  return null
}

export const FiltersAtRest: Story = {
  name: 'Filter bar, at rest',
  decorators: [WithSearchProviders()],
  render: () => (
    <Stage>
      <SearchHarness>
        <Filters />
      </SearchHarness>
    </Stage>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'No filters, no narrowed types: the document-types control reads "All types" and the add-filter button is the only other affordance in the row. The clear-filters button does not render at all here - `Filters` only shows it once there is something to clear.',
      },
    },
  },
}

export const FiltersApplied: Story = {
  name: 'Filter bar, with filters applied',
  decorators: [WithSearchProviders()],
  render: () => (
    <Stage>
      <SearchHarness>
        <SeedFieldFilters
          fields={[
            {fieldPath: 'title', value: 'release'},
            {fieldPath: 'featured', value: true},
          ]}
        />
        <Filters />
      </SearchHarness>
    </Stage>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Two real filters, built with `buildSearchFilter` against the live schema-derived field definitions rather than typed by hand: "Title contains release" and "Featured is True". Each renders as its own pill with its own close button, and the clear-filters button has appeared now that there is something for it to clear. This is the bar at rest with filters on it; the story below shows what happens the instant a filter is added.',
      },
    },
  },
}

export const FilterJustAdded: Story = {
  name: 'Filter bar, the moment a filter is added',
  decorators: [WithSearchProviders()],
  render: () => (
    <Stage minHeight={420}>
      <SearchHarness>
        <SeedFieldFilters fields={[{fieldPath: 'featured', value: true}]} autoOpenLast />
        <Filters />
      </SearchHarness>
    </Stage>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The state immediately after picking a filter from the Add Filter menu: `Filters` tracks `lastAddedFilter` and gives it `initialOpen`, so the value editor is already open and focused. It is a genuinely good nudge - a filter with no value set does nothing, so the product does not make you find the pill and click it. Given its own story, and its own vertical room, because seeing it appear over a resting filter bar reads as a rendering fault rather than the deliberate hand-off it is.',
      },
    },
  },
}

export const FiltersFullscreen: Story = {
  name: 'Filter bar, full-screen layout',
  decorators: [WithSearchProviders()],
  render: () => (
    <Stage width={420}>
      <SearchHarness fullscreen>
        <SeedFieldFilters fields={[{fieldPath: 'title', value: 'release'}]} />
        <SeedSearchState types={['article']} />
        <Filters />
      </SearchHarness>
    </Stage>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The same bar in the narrow, full-screen dialog. `Filters` reads `state.fullscreen` directly: the add-filter and clear-filters buttons drop to a second row below the pills instead of sharing the first with the document-types control, each pill loses its own close button (removal moves inside the filter's own popover instead), and every control steps up to `large`. As above, the one filter seeded here is also the last one added, so its popover opens on mount rather than staying collapsed.",
      },
    },
  },
}

export const AddFilterOpen: Story = {
  name: 'Add-filter popover, open',
  decorators: [WithSearchProviders()],
  render: () => (
    <Stage width={420}>
      <SearchHarness>
        <Flex padding={2}>
          <AddFilterButton />
        </Flex>
      </SearchHarness>
    </Stage>
  ),
  // Skipped in docs view on purpose. A play function that opens a portalled popover is fine on its
  // own canvas, but a docs page renders every story in ONE document, so each opened popover stacks
  // a full-screen layer over the prose until the page is unreadable. Canvas view still gets the
  // real interaction.
  play: async ({canvasElement, viewMode}) => {
    if (viewMode === 'docs') return
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('button', {name: 'Add filter'}))
    const body = within(canvasElement.ownerDocument.body)
    await body.findByText('All fields')
  },
  parameters: {
    docs: {
      description: {
        story:
          'The field list a moment after opening, grouped under a single "All fields" header ' +
          'because no document type is narrowed yet. Every entry comes from ' +
          '`definitions.fields`, itself walked out of the fixture schema by ' +
          '`createFieldDefinitions`: add a string, a boolean, a date or a reference field to a ' +
          'schema and it shows up here unasked, which is the point of this control.',
      },
    },
  },
}

export const AddFilterFiltered: Story = {
  name: 'Add-filter popover, narrowed by typing',
  decorators: [WithSearchProviders()],
  render: () => (
    <Stage width={420}>
      <SearchHarness>
        <Flex padding={2}>
          <AddFilterButton />
        </Flex>
      </SearchHarness>
    </Stage>
  ),
  // Skipped in docs view on purpose. A play function that opens a portalled popover is fine on its
  // own canvas, but a docs page renders every story in ONE document, so each opened popover stacks
  // a full-screen layer over the prose until the page is unreadable. Canvas view still gets the
  // real interaction.
  play: async ({canvasElement, viewMode}) => {
    if (viewMode === 'docs') return
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('button', {name: 'Add filter'}))
    const body = within(canvasElement.ownerDocument.body)
    const input = await body.findByLabelText('Filter by title')
    await userEvent.type(input, 'read')
    await body.findByText('Reading time (minutes)')
  },
  parameters: {
    docs: {
      description: {
        story:
          'The same field list narrowed by a plain substring match against each field\'s title path - "read" leaves only "Reading time (minutes)" standing. There is no fuzzy search and no ranking here, just `includes`, so typing a whole word is the reliable way to find a field.',
      },
    },
  },
}

export const DocumentTypesClosed: Story = {
  name: 'Document types control, closed',
  decorators: [WithSearchProviders()],
  render: () => (
    <Stage width={320} minHeight={200}>
      <SearchHarness>
        <Flex padding={2}>
          <DocumentTypesButton />
        </Flex>
      </SearchHarness>
    </Stage>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'With nothing narrowed, the button reads "All types" rather than naming every document type the workspace has. A generic label is the honest one when the search genuinely spans everything.',
      },
    },
  },
}

export const DocumentTypesOpen: Story = {
  name: 'Document types control, open',
  decorators: [WithSearchProviders()],
  render: () => (
    <Stage width={320}>
      <SearchHarness>
        <Flex padding={2}>
          <DocumentTypesButton />
        </Flex>
      </SearchHarness>
    </Stage>
  ),
  // Skipped in docs view on purpose. A play function that opens a portalled popover is fine on its
  // own canvas, but a docs page renders every story in ONE document, so each opened popover stacks
  // a full-screen layer over the prose until the page is unreadable. Canvas view still gets the
  // real interaction.
  play: async ({canvasElement, viewMode}) => {
    if (viewMode === 'docs') return
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('button', {name: 'All types'}))
    const body = within(canvasElement.ownerDocument.body)
    await body.findByText('Article')
  },
  parameters: {
    docs: {
      description: {
        story:
          'The three fixture document types, sorted alphabetically by title - the same ordering the field list in Add Filter uses. Selecting one narrows search to that type and, downstream, narrows the field list Add Filter offers to fields that type actually has.',
      },
    },
  },
}

export const DocumentTypesSelected: Story = {
  name: 'Document types control, one type selected',
  decorators: [WithSearchProviders()],
  render: () => (
    <Stage width={320} minHeight={200}>
      <SearchHarness>
        <SeedSearchState types={['article']} />
        <Flex padding={2}>
          <DocumentTypesButton />
        </Flex>
      </SearchHarness>
    </Stage>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The button label now names the narrowed type instead of "All types". This is the same `state.terms.types` that Add Filter reads to decide whether to group its own field list by document type, so this story and the narrowed Add Filter story above are two views of one piece of state.',
      },
    },
  },
}

export const SortMenuClosed: Story = {
  name: 'Sort menu, closed',
  decorators: [WithSearchProviders()],
  render: () => (
    <Stage width={320} minHeight={200}>
      <SearchHarness>
        <SortMenu />
      </SearchHarness>
    </Stage>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The default ordering is relevance ("Best match"), the only ordering whose GROQ sort is computed from the query itself rather than from a document field; the rest are plain field sorts on `_createdAt` or `_updatedAt`.',
      },
    },
  },
}

export const SortMenuOpen: Story = {
  name: 'Sort menu, open',
  decorators: [WithSearchProviders()],
  render: () => (
    <Stage width={320}>
      <SearchHarness>
        <SortMenu />
      </SearchHarness>
    </Stage>
  ),
  // Skipped in docs view on purpose. A play function that opens a portalled popover is fine on its
  // own canvas, but a docs page renders every story in ONE document, so each opened popover stacks
  // a full-screen layer over the prose until the page is unreadable. Canvas view still gets the
  // real interaction.
  play: async ({canvasElement, viewMode}) => {
    if (viewMode === 'docs') return
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('button', {name: 'Best match'}))
    const body = within(canvasElement.ownerDocument.body)
    await body.findByText('Created: Newest first')
  },
  parameters: {
    docs: {
      description: {
        story:
          'The five orderings the workspace ships with, grouped by axis - relevance, then created, then updated - with dividers between the groups. The current ordering shows `pressed`, the same treatment a selected menu item gets everywhere else in Studio.',
      },
    },
  },
}

export const SearchHeaderEmpty: Story = {
  name: 'Search header, empty query',
  decorators: [WithSearchProviders()],
  render: () => (
    <Stage width={480} minHeight={140}>
      <SearchHarness>
        <SearchHeader />
      </SearchHarness>
    </Stage>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Just the query field, no close button and no filter toggle. Both are full-screen-only chrome - `SearchHeader` reads `state.fullscreen` to decide - because the popover has its own dismissal (clicking outside) and its filter bar cannot be hidden at all (see `Filters`, which forces `filtersVisible` on whenever `!fullscreen`).',
      },
    },
  },
}

export const SearchHeaderWithQuery: Story = {
  name: 'Search header, with a query',
  decorators: [WithSearchProviders()],
  render: () => (
    <Stage width={480} minHeight={140}>
      <SearchHarness>
        <SeedSearchState query="release" />
        <SearchHeader />
      </SearchHarness>
    </Stage>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'A clear button appears once there is a query to clear, and the search icon is ready to swap for the spinner the moment `result.loading` goes true (see the Search Popover stories for that state held open).',
      },
    },
  },
}

export const SearchHeaderFullscreen: Story = {
  name: 'Search header, full-screen',
  decorators: [WithSearchProviders()],
  render: () => (
    <Stage width={380} minHeight={140}>
      <SearchHarness fullscreen>
        <SeedSearchState query="release" types={['article']} />
        <SearchHeader onClose={() => undefined} />
      </SearchHarness>
    </Stage>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The full-screen dialog's header: a back arrow closes the whole search, and a filter toggle sits beside the field. With a type narrowed, the toggle carries a `primary` tone - the only notification this control gives that filters are active, since there is no count.",
      },
    },
  },
}
