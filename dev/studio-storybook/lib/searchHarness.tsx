import {type SanityClient} from '@sanity/client'
import {BoundaryElementProvider, LayerProvider} from '@sanity/ui'
import {type Decorator} from '@storybook/react-vite'
import {type ReactNode, useEffect, useMemo, useState} from 'react'

import {useSchema} from '../../../packages/sanity/src/core/hooks/useSchema'
import {SearchProvider} from '../../../packages/sanity/src/core/studio/components/navbar/search/contexts/search/SearchProvider'
import {useSearchState} from '../../../packages/sanity/src/core/studio/components/navbar/search/contexts/search/useSearchState'
import {getFilterDefinition} from '../../../packages/sanity/src/core/studio/components/navbar/search/definitions/filters'
import {type SearchFilter} from '../../../packages/sanity/src/core/studio/components/navbar/search/types'
import {type SearchOrdering} from '../../../packages/sanity/src/core/studio/components/navbar/search/types'
import {buildSearchFilter} from '../../../packages/sanity/src/core/studio/components/navbar/search/utils/filterUtils'
import {
  createFailingContentLakeClient,
  createMockContentLakeClient,
  createPendingContentLakeClient,
} from './mockContentLake'
import {NavbarProviders} from './navbarHarness'
import {searchFixtureDocuments, searchSchemaTypes} from './searchFixtures'
import {WithStudioProviders} from './testProvider'

/**
 * Harness for the Studio search subsystem.
 *
 * Search is the one navbar surface that is not a component but a small application: a
 * `SearchProvider` reducer holding terms, filters, document-type narrowing and ordering; a filter
 * engine derived from the schema; and a live GROQ execution behind `useSearch`. Storying it as a
 * set of static screenshots would misrepresent it, so the harness wires the real loop and lets the
 * stories drive it: the query you type is the query that runs.
 *
 * Three pieces make that work:
 *  - a schema with every field family (see `searchFixtures`), so the filter engine has real fields
 *    to offer rather than three strings;
 *  - a groq-js backed client (see `mockContentLake`), so `useSearch` gets real hits offline;
 *  - `SearchProvider` itself, which needs `useSchema`, `useCurrentUser`, `useSource().search` and
 *    `useActiveReleases` - all already seeded by `WithStudioProviders`.
 */

const searchConfig = {
  name: 'default',
  title: 'Acme Content',
  schema: {name: 'default', types: searchSchemaTypes},
  /**
   * The stories run the `groqLegacy` strategy, not the `groq2024` default, and that is a real
   * constraint rather than a preference.
   *
   * `groq2024` searches with `text::matchQuery` and ranks with GROQ's `score()`. groq-js does not
   * implement either ("not implemented" at evaluation time), so a groq2024 query cannot be
   * evaluated offline at all. `groqLegacy` tokenizes client-side and searches with plain `match`,
   * which groq-js evaluates exactly.
   *
   * What this costs: relevance ranking here is the legacy client-side weighting, not the server's
   * 2024 scoring, so ordering of hits is indicative rather than production-identical. Everything
   * the stories are actually about - the reducer, the filter engine, the query lifecycle, the
   * result states - is unaffected, because both strategies drive the same UI.
   */
  search: {strategy: 'groqLegacy' as const},
}

export type SearchLakeMode = 'results' | 'empty' | 'error' | 'loading'

function clientFor(mode: SearchLakeMode): SanityClient {
  switch (mode) {
    case 'empty':
      // A working lake with nothing in it: the "no results" state is a real empty result set,
      // not a component prop we set by hand.
      return createMockContentLakeClient({documents: []})
    case 'error':
      return createFailingContentLakeClient('Search request failed (mock)')
    case 'loading':
      return createPendingContentLakeClient()
    default:
      return createMockContentLakeClient({documents: searchFixtureDocuments})
  }
}

/**
 * Story decorator: studio providers + the fixture schema + a groq-backed client.
 * Wrap the story body in {@link SearchHarness} to add the SearchProvider itself.
 */
export function WithSearchProviders(options: {mode?: SearchLakeMode} = {}): Decorator {
  return WithStudioProviders({
    config: searchConfig,
    client: clientFor(options.mode ?? 'results'),
  })
}

/**
 * The provider stack a search surface needs. `fullscreen` matches the two shapes the studio
 * actually renders search in: the full-screen dialog on narrow viewports, the popover on wide ones.
 */
export function SearchHarness({
  children,
  fullscreen = false,
}: {
  children: ReactNode
  fullscreen?: boolean
}) {
  const [boundary, setBoundary] = useState<HTMLDivElement | null>(null)
  return (
    <NavbarProviders>
      {/* StudioNavbar wraps search in a LayerProvider (so the popover stacks) and a
          BoundaryElementProvider (so popovers nested INSIDE search - Add filter, the document-type
          menu, each filter's value editor - know what box to stay within).

          The boundary must be an element with real height, and getting this wrong fails silently
          and totally: a nested popover constrained to a zero-height box renders `display: none`,
          so the buttons look completely dead rather than broken.

          Two wrong answers we shipped before this comment existed:
           - a plain `position: relative` wrapper. SearchPopover and SearchDialog portal their
             content out of the tree, so the wrapper collapses to 0px.
           - `document.body`, which is what StudioNavbar passes. Correct in a studio, useless here:
             in a story canvas everything is portalled or absolutely positioned, so body's layout
             height was 40px.
          Hence an explicitly full-viewport stage. It is also why this only ever broke in the
          portalled surfaces - Filter Shell renders <Filters> inline, which gave the wrapper enough
          height to mask the bug. */}
      <LayerProvider>
        {/* The boundary is a FIXED, non-interactive measuring element, deliberately separate from
            the content. It fills the viewport for measurement purposes but contributes no layout
            height, so a story is only as tall as it actually is.

            The obvious alternative - wrapping the children in a `min-height: 100vh` div - gives
            popovers the room they need and then makes every story a full viewport tall. That is
            invisible in canvas view and ruinous in docs view, where a dozen stories render on one
            page and each one is 940px of mostly nothing. */}
        <div
          ref={setBoundary}
          aria-hidden
          style={{position: 'fixed', inset: 0, pointerEvents: 'none'}}
        />
        <BoundaryElementProvider element={boundary}>
          <SearchProvider fullscreen={fullscreen}>{children}</SearchProvider>
        </BoundaryElementProvider>
      </LayerProvider>
    </NavbarProviders>
  )
}

/**
 * Put the search state machine into a given state on mount.
 *
 * The alternative - a `play` function that types into the field - simulates a user but makes every
 * story wait on debounce and animation before it shows anything, and makes the state implicit in a
 * script. Dispatching the real reducer actions is both faster and more legible: the story declares
 * the state it is about, and the machine is the same one the studio runs. The query still executes
 * for real; only the keystrokes are skipped.
 *
 * Render it as a sibling INSIDE the search surface, so it sits under the provider.
 */
export function SeedSearchState({
  query,
  types,
  filters,
  ordering,
  filtersVisible,
}: {
  query?: string
  /** Schema type names to narrow the search to, e.g. `['article']`. */
  types?: string[]
  filters?: SearchFilter[]
  ordering?: SearchOrdering
  filtersVisible?: boolean
}) {
  const {dispatch} = useSearchState()
  const schema = useSchema()
  useEffect(() => {
    if (typeof filtersVisible === 'boolean') {
      dispatch({type: 'FILTERS_VISIBLE_SET', visible: filtersVisible})
    }
    for (const name of types ?? []) {
      const schemaType = schema.get(name)
      if (schemaType) dispatch({type: 'TERMS_TYPE_ADD', schemaType})
    }
    for (const filter of filters ?? []) dispatch({type: 'TERMS_FILTERS_ADD', filter})
    if (ordering) dispatch({type: 'ORDERING_SET', ordering})
    // query last: it is what triggers the execution, so everything else is already in state
    if (typeof query === 'string') dispatch({type: 'TERMS_QUERY_SET', query})
    // mount-only: this seeds an initial state, it does not track prop changes
    // oxlint-disable-next-line exhaustive-deps
  }, [])
  return null
}

/**
 * Resolve a real, filter-engine-shaped {@link SearchFilter} for a field on the fixture schema,
 * carrying the given value, without dispatching it into the reducer.
 *
 * `FilterIcon`, `FilterDetails`, `FilterTitle`, `FilterLabel` and `FilterPill` are all RENDERERS:
 * their job is to display a `SearchFilter` someone else decided on, not to decide which filter is
 * active. Handing them one built this way (rather than one seeded into state via
 * {@link SeedSearchState}) is supplying their input directly, the same way `ButtonValue`'s exports
 * are handed a value prop. It only works for a field that actually exists in `searchSchemaTypes`
 * (see `searchFixtures.ts`) - an unknown `fieldPath` resolves to `undefined`, same as it would for
 * a stale filter in the real product.
 *
 * Must be called from inside {@link SearchHarness}. Mirrors the local `SeedFieldFilters` helper in
 * `stories/search/FilterShell.stories.tsx`, which does the same resolution but dispatches into the
 * reducer instead of returning - use that one when the story needs the filter to be live (openable,
 * removable, editable), this one when the story only needs something to render.
 */
export function useFieldFilter(fieldPath: string, value?: unknown): SearchFilter | undefined {
  const {
    state: {definitions},
  } = useSearchState()
  return useMemo(() => {
    const fieldDefinition = Object.values(definitions.fields).find(
      (field) => field.fieldPath === fieldPath,
    )
    if (!fieldDefinition) return undefined
    const filterDefinition = getFilterDefinition(definitions.filters, fieldDefinition.filterName)
    if (!filterDefinition) return undefined
    return {...buildSearchFilter(filterDefinition, fieldDefinition.id), value}
  }, [definitions, fieldPath, value])
}

// `OverlayStoryNotice` used to live here. It moved to `lib/overlayStoryNotice.tsx` once a
// second chapter needed it (the Not Authenticated screen, a Dialog) — it was never a search
// concern, search just hit the problem first. Re-exported so existing imports keep working.
export {OverlayStoryNotice} from './overlayStoryNotice'

export {searchFixtureDocuments, searchSchemaTypes}
