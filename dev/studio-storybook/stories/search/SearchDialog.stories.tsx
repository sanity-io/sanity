import {type Meta, type StoryObj} from '@storybook/react-vite'

import {SearchDialog} from '../../../../packages/sanity/src/core/studio/components/navbar/search/SearchDialog'
import {
  SearchHarness,
  SeedSearchState,
  WithSearchProviders,
  OverlayStoryNotice,
} from '../../lib/searchHarness'

const noop = () => undefined

const meta: Meta = {
  title: 'Search/Search Dialog',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          'Below a breakpoint, Studio swaps the anchored search popover for a full-screen ' +
            'dialog: the same provider, the same filter engine, the same query execution, in a ' +
            'frame that owns the whole screen.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/studio/components/navbar/search/SearchDialog.tsx` |',
          '| Tier | CHROME |',
          '| Audit | ⚪ not-audited |',
          '| Patterns | `search` |',
          '',
          '> **Why it matters:** the pair is a good lesson in what responsive means for a ' +
            'stateful surface. Nothing about the machine changes between the two, only the frame ' +
            "and one flag. That flag changes behaviour in one visible way: the empty state's " +
            'instructional copy renders only in the full-screen frame, so the resting state here ' +
            'has copy and the popover does not.',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:search', 'pattern:search', 'audit:not-audited', 'source:studio', 'tier:chrome'],
}

export default meta
type Story = StoryObj

const dialog = (seed?: React.ReactNode) => (
  <SearchHarness fullscreen>
    {seed}
    <SearchDialog open onClose={noop} onOpen={noop} />
  </SearchHarness>
)

export const Default: Story = {
  name: 'Open, at rest',
  decorators: [WithSearchProviders()],
  parameters: {
    docs: {
      description: {
        story:
          'The resting full-screen state: no query, the filter bar showing, and an empty body. The instructional copy is one step away - see "Instructions, with filters collapsed" below - because `RecentSearches` shows it only when the filter bar is hidden.',
      },
    },
  },
  render: (_args, {viewMode, id, name}) =>
    viewMode === 'docs' ? <OverlayStoryNotice title={name} storyId={id} /> : dialog(),
}

export const WithResults: Story = {
  name: 'A query with results',
  decorators: [WithSearchProviders()],
  parameters: {
    docs: {
      description: {
        story:
          'The same fixture documents, genuinely searched, in the full-screen frame. Compare with the popover story: identical machine, identical results, different container.',
      },
    },
  },
  render: (_args, {viewMode, id, name}) =>
    viewMode === 'docs' ? (
      <OverlayStoryNotice title={name} storyId={id} />
    ) : (
      dialog(<SeedSearchState query="release" />)
    ),
}

export const NoResults: Story = {
  name: 'A query with no results',
  decorators: [WithSearchProviders()],
  parameters: {
    docs: {
      description: {
        story:
          'A real empty result set at full width, where the emptiness is much more conspicuous than it is in the popover. Worth looking at both, because the same state carries very different weight in the two frames.',
      },
    },
  },
  render: (_args, {viewMode, id, name}) =>
    viewMode === 'docs' ? (
      <OverlayStoryNotice title={name} storyId={id} />
    ) : (
      dialog(<SeedSearchState query="quarterly-forecast-spreadsheet" />)
    ),
}

export const RequestFailed: Story = {
  name: 'The search request failed',
  decorators: [WithSearchProviders({mode: 'error'})],
  parameters: {
    docs: {
      description: {
        story: 'The error state, produced by a genuinely rejected query rather than a posed prop.',
      },
    },
  },
  render: (_args, {viewMode, id, name}) =>
    viewMode === 'docs' ? (
      <OverlayStoryNotice title={name} storyId={id} />
    ) : (
      dialog(<SeedSearchState query="release" />)
    ),
}

export const NarrowedToType: Story = {
  name: 'Narrowed to one document type',
  decorators: [WithSearchProviders()],
  parameters: {
    docs: {
      description: {
        story:
          'Type narrowing applied: the same query, restricted to articles, so the matching Page drops out. The header shows the active narrowing and offers to clear it.',
      },
    },
  },
  render: (_args, {viewMode, id, name}) =>
    viewMode === 'docs' ? (
      <OverlayStoryNotice title={name} storyId={id} />
    ) : (
      dialog(<SeedSearchState query="release" types={['article']} />)
    ),
}

export const Instructions: Story = {
  name: 'Instructions, with filters collapsed',
  decorators: [WithSearchProviders()],
  parameters: {
    docs: {
      description: {
        story:
          'The only state in search that addresses a first-time user, and it is reachable ' +
          'through a narrow gate: `RecentSearches` renders `Instructions` only when ' +
          '`!filtersVisible && fullscreen`. So it appears on a narrow viewport, with the filter ' +
          'bar collapsed and nothing searched yet - and never in the popover at all, because ' +
          '`SearchHeader` forces `filtersVisible` back to true whenever `!fullscreen`.',
      },
    },
  },
  render: (_args, {viewMode, id, name}) =>
    viewMode === 'docs' ? (
      <OverlayStoryNotice title={name} storyId={id} />
    ) : (
      dialog(<SeedSearchState filtersVisible={false} />)
    ),
}

export const FiltersCollapsed: Story = {
  name: 'Results with the filter bar collapsed',
  decorators: [WithSearchProviders()],
  parameters: {
    docs: {
      description: {
        story:
          'Results with the filter bar toggled away, giving the list the full height. This is the collapse the header toggle produces, and it exists only in the full-screen frame.',
      },
    },
  },
  render: (_args, {viewMode, id, name}) =>
    viewMode === 'docs' ? (
      <OverlayStoryNotice title={name} storyId={id} />
    ) : (
      dialog(<SeedSearchState query="release" filtersVisible={false} />)
    ),
}
