import {type SanityClient, type StackablePerspective} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import {type Decorator, type Meta, type StoryObj} from '@storybook/react-vite'

import {Instructions} from '../../../../packages/sanity/src/core/studio/components/navbar/search/components/Instructions'
import {NoResults} from '../../../../packages/sanity/src/core/studio/components/navbar/search/components/NoResults'
import {RecentSearches} from '../../../../packages/sanity/src/core/studio/components/navbar/search/components/recentSearches/RecentSearches'
import {SearchError} from '../../../../packages/sanity/src/core/studio/components/navbar/search/components/SearchError'
import {DebugOverlay} from '../../../../packages/sanity/src/core/studio/components/navbar/search/components/searchResults/item/DebugOverlay'
import {SearchResultItem} from '../../../../packages/sanity/src/core/studio/components/navbar/search/components/searchResults/item/SearchResultItem'
import {SearchResults} from '../../../../packages/sanity/src/core/studio/components/navbar/search/components/searchResults/SearchResults'
import {RECENT_SEARCH_VERSION} from '../../../../packages/sanity/src/core/studio/components/navbar/search/datastores/useStoredSearch'
import {createMockContentLakeClient} from '../../lib/mockContentLake'
import {createMockDocumentPreviewStore} from '../../lib/mockDocumentPreviewStore'
import {
  SearchHarness,
  searchFixtureDocuments,
  searchSchemaTypes,
  SeedSearchState,
  WithSearchProviders,
} from '../../lib/searchHarness'
import {WithStudioProviders} from '../../lib/testProvider'

// Mirrors `searchConfig` in `lib/searchHarness.tsx` (not exported from there): the fixture
// schema, run on the `groqLegacy` strategy so the mock lake's groq-js evaluation applies.
const searchConfig = {
  name: 'default',
  title: 'Acme Content',
  schema: {name: 'default', types: searchSchemaTypes},
  search: {strategy: 'groqLegacy' as const},
}

/**
 * `searchFixtureDocuments`, unmodified except for a fabricated `_rev` on every entry, fed to
 * {@link createMockDocumentPreviewStore} instead of the search client.
 *
 * Why a second copy of the fixtures is needed: `WithSearchProviders` leaves `useDocumentPreviewStore()`
 * to build itself from the search client, which is backed by `applyDraftPerspective` - the *overlaid*
 * dataset a real GROQ query would see, where a draft and its published sibling are already merged into
 * one document under the published id. That is correct for search hits, and wrong for
 * `useDocumentVersions`: it asks the preview store for the *raw*, un-merged ids (`drafts.<id>` and
 * `<id>` as separate documents) to work out whether a document is draft-only, published-only, or both -
 * see `unstable_observeVersionDocumentIds` below. Against the overlaid dataset that lookup always comes
 * back empty, so `DraftOnlyRow` would look identical to `ResultRow` for reasons that have nothing to do
 * with the search feature and everything to do with which fixture copy is asked. `_rev` matters too:
 * `getDocumentVersionInfoFromVersions` gates on `Boolean(version._rev)`, and the plain fixture objects
 * do not carry one.
 */
const versionedFixtureDocuments = searchFixtureDocuments.map(
  (doc, index) => ({...doc, _rev: `rev-${index}`}) as unknown as SanityDocument,
)

/**
 * A search decorator that keeps `WithSearchProviders`' real GROQ-backed client for the query itself,
 * but swaps in `createMockDocumentPreviewStore` (seeded with the raw, un-overlaid fixtures) so that
 * `SearchResultItemPreview`'s status dot - which reads `useDocumentVersions`, not the search hit - can
 * actually tell a draft from a published document. See `versionedFixtureDocuments` above for why the
 * default harness cannot do this on its own.
 */
function withDocumentVersions(client: SanityClient): Decorator {
  return WithStudioProviders({
    config: searchConfig,
    client,
    previewStore: createMockDocumentPreviewStore({documents: versionedFixtureDocuments}),
  })
}

const meta: Meta = {
  title: 'Search/Results',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          'Everything downstream of a query lives here: the virtualized hit list and its row, ' +
            'the three ways a search can come up empty, and recent searches, the list that ' +
            'greets an editor before they have typed anything at all.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/studio/components/navbar/search/components/searchResults/` (`SearchResults.tsx`, `item/SearchResultItem.tsx`, `item/SearchResultItemPreview.tsx`, `item/DebugOverlay.tsx`), `.../recentSearches/` (`RecentSearches.tsx`, `item/RecentSearchItem.tsx`), `.../NoResults.tsx`, `.../SearchError.tsx`, `.../Instructions.tsx` |',
          '| Tier | SERVICE |',
          '| Audit | ⚪ not-audited |',
          '| Patterns | `search` |',
          '',
          'The Search Popover and Search Dialog pages are the two frames this content sits ' +
            'inside; this page looks at the content itself.',
          '',
          '> **Why it matters:** a results list has more failure modes than a happy path, and ' +
            'this page pins each one separately rather than letting them blur into search ' +
            'working or not. No query, a query with zero hits, and a query that errors are three ' +
            'distinct states with three distinct messages, and conflating any two of them is a ' +
            'real support-ticket generator: someone reporting search is not finding anything when ' +
            'in fact nothing was ever typed. Recent searches carries its own smaller version of ' +
            "the same lesson: an editor's first-ever search and their tenth look identical in the " +
            'popover shell, and only this list tells them apart.',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:search', 'pattern:search', 'audit:not-audited', 'source:studio', 'tier:service'],
}

export default meta
type Story = StoryObj

const resultsPage = (seed?: React.ReactNode, previewPerspective?: StackablePerspective[]) => (
  <SearchHarness>
    {seed}
    <SearchResults inputElement={null} previewPerspective={previewPerspective} />
  </SearchHarness>
)

export const ResultsPopulated: Story = {
  name: 'A populated results list',
  decorators: [
    withDocumentVersions(createMockContentLakeClient({documents: searchFixtureDocuments})),
  ],
  parameters: {
    docs: {
      description: {
        story:
          "The default working state of the whole page: \"release\" runs as a real GROQ query against the fixture documents and comes back with three hits (`Announcing the summer release`, `Deprecated: the old release process`, `Release notes`), sorted by the strategy's relevance weighting. This is the virtualized `CommandList` from `../../../../components`, not a plain map over an array - the sort menu above it only appears once there is something to sort. `previewPerspective={['drafts']}` is passed through to every row for the same reason `ResultRow` below needs it - see `versionedFixtureDocuments`.",
      },
    },
  },
  render: () => resultsPage(<SeedSearchState query="release" />, ['drafts']),
}

export const ResultsNoHits: Story = {
  name: 'A query with no hits, shown in place',
  decorators: [WithSearchProviders()],
  parameters: {
    docs: {
      description: {
        story:
          'The `NoResults` story below in isolation; this is the same message reached the real way, embedded inside `SearchResults` after a query that genuinely matches nothing. `hasNoSearchResults` requires both `!result.hits.length` and `result.loaded` - a query that has not finished yet does not flash this message on its way to a result.',
      },
    },
  },
  render: () => resultsPage(<SeedSearchState query="quarterly-forecast-spreadsheet" />),
}

export const ResultsRequestFailed: Story = {
  name: 'A failed request, shown in place',
  decorators: [WithSearchProviders({mode: 'error'})],
  parameters: {
    docs: {
      description: {
        story:
          '`SearchError` embedded inside `SearchResults` the way it actually appears: `result.error` is truthy, so the whole results region swaps to the error message instead of an empty list. Nothing about this state is posed - the mock lake genuinely rejects the query and `useSearch` catches it.',
      },
    },
  },
  render: () => resultsPage(<SeedSearchState query="release" />),
}

export const ResultRow: Story = {
  name: 'A single result row',
  decorators: [
    withDocumentVersions(createMockContentLakeClient({documents: searchFixtureDocuments})),
  ],
  parameters: {
    docs: {
      description: {
        story:
          '`SearchResultItem` rendered on its own, outside a `CommandList`. It is honestly standalone: the component only needs `documentId` and `documentType` as data, and reaches into context (`useSearchState`, `useSchema`, `useDocumentPresence`, `useGrantsStore`) for everything else, the same way it would as a virtualized row. The badge, status dot and title come from `SearchResultItemPreview`, which subscribes to the real preview store for `article-launch` - a published-only document, so the status dot reads "published" with no draft indicator. Compare against `DraftOnlyRow` below.',
      },
    },
  },
  render: () => (
    <SearchHarness>
      <SearchResultItem
        disableIntentLink
        documentId="article-launch"
        documentType="article"
        previewPerspective={['drafts']}
      />
    </SearchHarness>
  ),
}

export const DraftOnlyRow: Story = {
  name: 'A draft-only result row',
  decorators: [
    withDocumentVersions(createMockContentLakeClient({documents: searchFixtureDocuments})),
  ],
  parameters: {
    docs: {
      description: {
        story:
          "The same row for `drafts.article-migration` - a document with no published counterpart. `SearchResults` never passes a `drafts.` id to this component: the mock Content Lake resolves drafts server-side the same way the real one does (see `applyDraftPerspective` in `lib/mockContentLake.ts`), so a hit for this document already carries the published-shaped id `article-migration` with the draft content attached. What distinguishes the row from `ResultRow` above is not the id or the layout, it is `SearchResultItemPreview`'s status indicator: `useDocumentVersions` resolves a draft with no published sibling, so the dot renders in its draft-only tone rather than published. Getting this to render at all took a second, un-overlaid copy of the fixtures - see the `versionedFixtureDocuments` comment near the top of this file for why the default harness cannot show the distinction on its own.",
      },
    },
  },
  render: () => (
    <SearchHarness>
      <SearchResultItem
        disableIntentLink
        documentId="article-migration"
        documentType="article"
        previewPerspective={['drafts']}
      />
    </SearchHarness>
  ),
}

const debugHit = {
  hit: {_id: 'article-launch', _type: 'article'},
  resultIndex: 0,
  score: 0.62,
  stories: [
    {path: 'title', score: 0.4, why: 'text::match("release")'},
    {path: 'tags', score: 0.22, why: 'text::match("release")'},
    {path: 'body', score: 0, why: 'no match'},
  ],
}

export const DebugScore: Story = {
  name: 'The debug score overlay',
  decorators: [
    withDocumentVersions(createMockContentLakeClient({documents: searchFixtureDocuments})),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Not reachable from a story-seeded state: `SearchResults` only renders `DebugOverlay` when `state.debug` is true, and that flag comes from `isDebugMode()` (a runtime check, not a reducer action), so there is no `SeedSearchState` prop that turns it on. `DebugOverlay` itself takes a `WeightedHit` as a plain prop, so this story hands it a fabricated one directly, stacked over the same result row it would sit on in production. Read it as: a tone-coded score chip in the corner, and on hover, the per-field breakdown that produced it - which paths matched, and how much each contributed.',
      },
    },
  },
  render: () => (
    <SearchHarness>
      <SearchResultItem
        disableIntentLink
        documentId="article-launch"
        documentType="article"
        previewPerspective={['drafts']}
      />
      <DebugOverlay data={debugHit} />
    </SearchHarness>
  ),
}

export const ResultsEmpty: Story = {
  name: 'No results (component in isolation)',
  decorators: [WithSearchProviders()],
  parameters: {
    docs: {
      description: {
        story:
          '`NoResults` on its own. It carries no props - the two lines of copy are static translation strings - so what is worth pinning is simply that it exists as its own component rather than an inline conditional inside `SearchResults`, which is what lets `ResultsNoHits` above compose it in for real.',
      },
    },
  },
  render: () => (
    <SearchHarness>
      <NoResults />
    </SearchHarness>
  ),
}

export const ResultsFailed: Story = {
  name: 'Request failed (component in isolation)',
  decorators: [WithSearchProviders()],
  parameters: {
    docs: {
      description: {
        story:
          '`SearchError` on its own, the sibling of `NoResults` above. Same shape (icon, title, help text) but critical tone throughout, and an `aria-live="assertive"` region, same as `NoResults` - both messages interrupt a screen reader rather than waiting to be found.',
      },
    },
  },
  render: () => (
    <SearchHarness>
      <SearchError />
    </SearchHarness>
  ),
}

export const Guidance: Story = {
  name: 'Instructions (component in isolation)',
  decorators: [WithSearchProviders()],
  parameters: {
    docs: {
      description: {
        story:
          "The keyboard-hint copy shown before an editor has searched anything, in isolation. `RecentSearches` is the only place that mounts it, and only under a specific condition (see the two Recent Searches stories below), so it is worth seeing the component on its own first: a single translated string built with `<Translate>`, with a `ControlsIcon` spliced into the middle of the sentence at the point the copy's `{{ControlsIcon}}` placeholder falls.",
      },
    },
  },
  render: () => (
    <SearchHarness>
      <Instructions />
    </SearchHarness>
  ),
}

const recentSearchesPage = (fullscreen: boolean, seed?: React.ReactNode) => (
  <SearchHarness fullscreen={fullscreen}>
    {seed}
    <RecentSearches inputElement={null} />
  </SearchHarness>
)

export const RecentSearchesEmptyPopover: Story = {
  name: 'Recent searches, empty (popover)',
  decorators: [WithSearchProviders()],
  parameters: {
    docs: {
      description: {
        story:
          'The popover-shaped empty state. `filtersVisible` defaults to `true` (`SearchHeader` forces it whenever `!fullscreen`), so the `!filtersVisible && fullscreen` condition that would show `Instructions` is false on both counts, and the region renders nothing at all: no border, no copy, an empty box. That is deliberate, not a bug - the popover already shows the filter bar, so there is nothing left to hint at.',
      },
    },
  },
  render: () => recentSearchesPage(false),
}

export const RecentSearchesEmptyFullscreen: Story = {
  name: 'Recent searches, empty (full screen, filters hidden)',
  decorators: [WithSearchProviders()],
  parameters: {
    docs: {
      description: {
        story:
          '`Instructions`, in the one place it actually mounts: `fullscreen` is true and `filtersVisible` is seeded `false` (the full-screen dialog\'s resting state before the filter toggle is opened). With no recent searches and no filters bar in the way, `RecentSearches` falls through to the `Instructions` branch instead of the search-history list. This is the counterpart to `RecentSearchesEmptyPopover`: same "nothing has happened yet" state, but the full-screen dialog has the vertical room to explain itself where the popover does not.',
      },
    },
  },
  render: () => recentSearchesPage(true, <SeedSearchState filtersVisible={false} />),
}

/**
 * A `WithStudioProviders` client patched to answer the studio's key-value `/users/me/keyvalue/*`
 * endpoint with seeded recent searches, instead of the harness's usual `clientFor(mode)`.
 *
 * Why this exists: recent searches persist through `useStoredSearch` (see
 * `.../navbar/search/datastores/useStoredSearch.ts`), a stale-while-revalidate
 * KeyValueStore keyed on `studio.search.recent.<dataset>`. It reads the browser's `localStorage`
 * first (fast, possibly stale), then "revalidates" against the server. Seeding `localStorage`
 * directly is not enough here: the mock lake client's default `request()` has no handler for the
 * key-value endpoint, so the revalidation leg resolves `null` moments after mount and the reducer
 * (correctly) treats that as "the server has nothing", replacing whatever `localStorage` had. The
 * fix is to answer the revalidation leg honestly rather than fake the caching layer: patch
 * `request()` on a real mock-lake client so both legs agree, and the seeded state is the value
 * that survives.
 */
function seededRecentSearchesClient(): SanityClient {
  const client = createMockContentLakeClient({documents: searchFixtureDocuments})
  const dataset = (client.config() as {dataset: string}).dataset
  const storageKey = `studio.search.recent.${dataset}`
  const seeded = {
    version: RECENT_SEARCH_VERSION,
    recentSearches: [
      {
        created: new Date(Date.UTC(2026, 6, 25, 8, 0)).toISOString(),
        filters: [],
        terms: {query: 'release', typeNames: ['article']},
      },
      {
        created: new Date(Date.UTC(2026, 6, 24, 15, 30)).toISOString(),
        filters: [],
        terms: {query: 'pricing', typeNames: []},
      },
    ],
  }
  const baseRequest = client.request.bind(client)
  ;(client as unknown as {request: typeof client.request}).request = ((opts: {uri: string}) => {
    if (opts.uri === `/users/me/keyvalue/${storageKey}`) {
      return Promise.resolve([{key: storageKey, value: seeded}])
    }
    return baseRequest(opts)
  }) as typeof client.request
  return client
}

export const RecentSearchesWithHistory: Story = {
  name: 'Recent searches, with history',
  decorators: [WithStudioProviders({config: searchConfig, client: seededRecentSearchesClient()})],
  parameters: {
    docs: {
      description: {
        story:
          'Two seeded searches - a query narrowed to Article, and a bare query with no type narrowing - rendered exactly as `getRecentSearchTerms` would reconstruct them from local storage: newest first, with a "Clear recent searches" action underneath. Clicking a row dispatches `TERMS_SET` and re-runs that search for real (not simulated here, but wired the same as every other seeded story on this page). See the `seededRecentSearchesClient` comment above for why this needed a patched client rather than a plain `localStorage.setItem` call.',
      },
    },
  },
  render: () => recentSearchesPage(true),
}
