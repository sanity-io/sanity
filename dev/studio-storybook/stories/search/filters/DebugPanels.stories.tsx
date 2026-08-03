import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {within} from 'storybook/test'

import {DebugDocumentTypes} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/debug/_DebugDocumentTypes'
import {DebugDocumentTypesNarrowed} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/debug/_DebugDocumentTypesNarrowed'
import {DebugFilterQuery} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/debug/_DebugFilterQuery'
import {DebugFilterValues} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/debug/_DebugFilterValues'
import {
  SearchHarness,
  SeedSearchState,
  useFieldFilter,
  WithSearchProviders,
} from '../../../lib/searchHarness'

/**
 * A JUDGEMENT CALL, not an omission: all four components below are exported, real, and mounted
 * in source (`Filters.tsx` and `FilterPopoverContent.tsx` both render them). But both mount sites
 * gate on the same import:
 *
 *   import {DEBUG_MODE} from '../../constants'   // constants.ts:11, export const DEBUG_MODE = false
 *
 * `DEBUG_MODE` is a hardcoded boolean literal, not a config flag, a URL param, or anything else a
 * studio operator can flip - reaching this branch requires editing `constants.ts` and rebuilding.
 * That makes every one of these four permanently unreachable in any shipped studio, present or
 * future, without a source change this catalog is not allowed to make.
 *
 * The decision: one combined page, not four. Four separate component pages would imply each is a
 * surface worth navigating to on its own, when in practice a developer only ever sees any of them
 * by locally patching a constant - the four belong together as one fact ("this internal debug
 * layer exists and is dead code"), not as four individually-discoverable pages.
 */
const meta: Meta = {
  title: 'Search/Debug Panels (unreachable)',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Four debug readouts exist for the filter engine, built for Studio engineers working ' +
            'on search itself, and no editor will ever see them: a hardcoded flag keeps every ' +
            'one of them permanently dark in any shipped build.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/studio/components/navbar/search/components/filters/debug/` (`_DebugFilterQuery.tsx`, `_DebugDocumentTypesNarrowed.tsx`, `_DebugDocumentTypes.tsx`, `_DebugFilterValues.tsx`) |',
          '| Tier | SERVICE |',
          '| Audit | ⚪ not-audited |',
          '| Patterns | `filters` |',
          '| Mounted by | `.../components/filters/Filters.tsx` (`DebugFilterQuery`, `DebugDocumentTypesNarrowed`) and `.../components/filters/filter/FilterPopoverContent.tsx` (`DebugDocumentTypes`, `DebugFilterValues`), both behind `{DEBUG_MODE && (...)}` where `DEBUG_MODE` (`constants.ts:11`) is `export const DEBUG_MODE = false` |',
          '| Cannot show | that any editor, in any studio, will ever see this rendered. It genuinely cannot happen without a source edit |',
          '',
          'The four are a raw filter GROQ fragment, the document types a field narrows to, the ' +
            "document types the whole search is narrowed to, and a filter's raw name, operator " +
            'and value. See the code comment above for why one combined page beats four separate ' +
            'ones.',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:search', 'pattern:filters', 'audit:not-audited', 'source:studio', 'tier:service'],
  decorators: [WithSearchProviders()],
}

export default meta
type Story = StoryObj

export const AllFour: Story = {
  name: 'All four panels, forced on',
  render: () => {
    function Demo() {
      const filter = useFieldFilter('title', 'release')
      // The boolean filter is what makes the FIRST panel render, and it is the reducer that
      // decides so. `TERMS_FILTERS_ADD` (reducer.ts:257-262) does not keep the value it is handed:
      // it replaces it with `getOperatorInitialValue(...)` for that operator. A `title` filter
      // defaults to `stringMatches`, whose `initialValue` is `null` (stringOperators.ts:36-44),
      // so seeding "release" produced a filter with no value, `generateFilterQuery` returned
      // nothing, `state.terms.filter` stayed falsy, and `_DebugFilterQuery` returned null. Three
      // panels rendered under a docblock promising four. `booleanEqual` is the one operator on
      // this schema whose `initialValue` is not null (`true`, booleanOperators.ts:17), so a
      // `featured` filter survives the same round trip and gives the query something to say.
      const booleanFilter = useFieldFilter('featured', true)
      if (!filter || !booleanFilter) return null
      return (
        <>
          {/* Dispatched for real, so `terms.filter` below is `generateFilterQuery`'s actual
              output, not a hand-typed stand-in. */}
          <SeedSearchState filters={[booleanFilter, filter]} types={['article']} />
          <Stack gap={0} style={{maxWidth: 420}}>
            <Card border padding={2} radius={2} tone="caution" marginBottom={3}>
              <Text size={1}>
                DEBUG_MODE gates all four of these off in every build. What follows is what the
                underlying components render when mounted directly, bypassing that gate the way
                nothing in a real studio can.
              </Text>
            </Card>
            <DebugFilterQuery />
            <DebugDocumentTypesNarrowed />
            <DebugDocumentTypes filter={filter} />
            <DebugFilterValues filter={filter} />
          </Stack>
        </>
      )
    }
    return (
      <SearchHarness>
        <Demo />
      </SearchHarness>
    )
  },
  // The story's own name promises four panels, and for a while it silently showed three: the
  // reducer discards a seeded value and substitutes the operator's `initialValue`, so the panel
  // that reads `state.terms.filter` had nothing to draw. A story that only demonstrates cannot
  // catch that coming back, so this asserts the promise instead of illustrating it.
  //
  // Each panel titles itself with a `weight="medium"` Code element: "Filter" (query),
  // "Document types (narrowed)", "Document types", and "Filter" again (values). Exact-match text
  // queries keep the two "Document types" titles apart, since testing-library matches the whole
  // normalised string rather than a substring.
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    // The regression guard: this string exists only if the boolean seed survived
    // `TERMS_FILTERS_ADD` and `generateFilterQuery` produced real GROQ.
    await canvas.findByText('featured == true')
    await canvas.findByText('Document types (narrowed)')
    await canvas.findByText('Document types')
    const filterTitles = await canvas.findAllByText('Filter')
    if (filterTitles.length !== 2) {
      throw new Error(
        `Expected 4 debug panels: the query and values panels both title themselves "Filter", so 2 were expected, found ${filterTitles.length}.`,
      )
    }
  },
  parameters: {
    docs: {
      description: {
        story:
          "All four stacked in mount order: `DebugFilterQuery` reads `state.terms.filter` (the raw GROQ this search would add, built by the real reducer rather than typed in), `DebugDocumentTypesNarrowed` reads `state.documentTypesNarrowed`, and the last two take a `title` filter directly and report its field-level document types and its raw `filterName` / `operatorType` / `value`. Reading each one confirms they work exactly as `Filters.tsx` and `FilterPopoverContent.tsx` wire them - the only thing standing between this and a real studio is the constant.\n\nTwo filters are seeded, not one, and the reason is worth knowing if you write another story against this state. `TERMS_FILTERS_ADD` discards the value it is given and substitutes the operator's own `initialValue`, which is `null` for every string operator. So a `title` filter contributes nothing to the query no matter what you seed it with, and the first panel renders empty. A `featured` boolean filter is the exception on this schema (`booleanEqual` starts at `true`), so it is what puts a query in the first panel; `title` is still what the last two panels read.",
      },
    },
  },
}
