import {Box, Card, Flex, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ReactNode} from 'react'
import {userEvent, within} from 'storybook/test'

import {FilterButton} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/filter/FilterButton'
import {FilterError} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/filter/FilterError'
import {FilterForm} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/filter/FilterForm'
import {FilterPopoverContent} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/filter/FilterPopoverContent'
import {OperatorsMenuButton} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/filter/OperatorsMenuButton'
import {useSearchState} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/contexts/search/useSearchState'
import {getOperatorDefinition} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/definitions/operators'
import {type SearchFilter} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/types'
import {
  OverlayStoryNotice,
  SearchHarness,
  SeedSearchState,
  useFieldFilter,
  WithSearchProviders,
} from '../../../lib/searchHarness'

const meta: Meta = {
  title: 'Search/Filter Editor',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          "The filter bar's one interactive control runs end to end here: the pill a person " +
            'clicks, the popover it opens, the operator picker and value form inside, and the ' +
            'fallback if that form ever crashes.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/studio/components/navbar/search/components/filters/filter/` (`FilterButton.tsx`, `FilterPopoverContent.tsx`, `FilterForm.tsx`, `OperatorsMenuButton.tsx`, `FilterError.tsx`) |',
          '| Tier | SERVICE |',
          '| Audit | ⚪ not-audited |',
          '| Patterns | `filters` |',
          '',
          '`FilterButton` is the closed pill; `FilterPopoverContent` and `FilterForm` are what ' +
            'opens inside it; `OperatorsMenuButton` is the "contains" control that switches ' +
            'operators without leaving the form; `FilterError` is what replaces all of it if the ' +
            "operator's own input component throws. See `FilterForm.tsx:62-68` for where the " +
            'catch happens, above the focus lock and below everything else on the page.',
          '',
          '> **Why it matters:** the value form wraps itself in its own error boundary, scoped ' +
            "to just that one form. A crash inside a single filter's operator input degrades to " +
            'the fallback for that one pill; the rest of the filter bar, the query field, and ' +
            'every other open filter keep working. That is a real design decision, not ' +
            'incidental plumbing.',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:search', 'pattern:filters', 'audit:not-audited', 'source:studio', 'tier:service'],
  decorators: [WithSearchProviders()],
}

export default meta
type Story = StoryObj

function Stage({children, minHeight = 420}: {children: ReactNode; minHeight?: number}) {
  return (
    <Flex padding={4} style={{minHeight}}>
      <Box style={{width: 420}}>{children}</Box>
    </Flex>
  )
}

// ---------------------------------------------------------------------------
// FilterButton: the closed pill and the popover it opens
// ---------------------------------------------------------------------------

function FilterButtonDemo({filter, initialOpen}: {filter?: SearchFilter; initialOpen?: boolean}) {
  if (!filter) return null
  return <FilterButton filter={filter} initialOpen={initialOpen} />
}

export const ButtonWithValue: Story = {
  name: 'FilterButton, a complete filter',
  render: () => {
    function Demo() {
      const filter = useFieldFilter('title', 'release')
      return <FilterButtonDemo filter={filter} />
    }
    return (
      <SearchHarness>
        <Stage>
          <Demo />
        </Stage>
      </SearchHarness>
    )
  },
  parameters: {
    docs: {
      description: {
        story:
          'A closed pill for `title contains "release"`, `tone="primary"` on both the label card and its separate close button because `validateFilter` finds a real value. Clicking it (canvas view) opens the popover this page\'s other stories show individually.',
      },
    },
  },
}

/** Module scope, not nested in `render`: the docs branch makes that render a named component, and
 * a component defined inside another is remounted on every parent render. */
function IncompleteFilterDemo() {
  const filter = useFieldFilter('title', undefined)
  return <FilterButtonDemo filter={filter} initialOpen />
}

export const ButtonIncomplete: Story = {
  name: 'FilterButton, right after being added',
  render: function ButtonIncompleteStory(_args, {viewMode, id, name}) {
    // The only story on this page that mounts a real, OPEN popover: `initialOpen` opens it at
    // mount with no click, and `FilterButton` portals it to `document.body`. On the composed docs
    // page that meant the form escaped this canvas (which showed the pill and nothing else) and
    // its `react-focus-lock` joined the page-level scramble. Measured before this change: five
    // simultaneously active `[data-focus-lock-disabled="false"]` nodes on this docs page, and the
    // two that were NOT inside any `.docs-story` were both this story's portalled form. The other
    // three are the `FilterPopoverContent` and two `FilterForm` stories, which render the form
    // inline as their own subject and stay in their own canvases; those are left alone.
    if (viewMode === 'docs') return <OverlayStoryNotice title={name} storyId={id} />
    return (
      <SearchHarness>
        <Stage>
          <IncompleteFilterDemo />
        </Stage>
      </SearchHarness>
    )
  },
  parameters: {
    docs: {
      description: {
        story:
          'No value yet, so `validateFilter` returns false: the pill drops to `tone="transparent"` and its label shows only the field name (see `FilterLabel`\'s `showContent={isValid}`). `initialOpen` reproduces the moment right after picking a filter from the Add Filter menu, when the form is already open waiting for a value.',
      },
    },
  },
}

// ---------------------------------------------------------------------------
// FilterPopoverContent and FilterForm: the form itself
// ---------------------------------------------------------------------------

export const PopoverContent: Story = {
  name: 'FilterPopoverContent',
  render: () => {
    function Demo() {
      const filter = useFieldFilter('featured', true)
      if (!filter) return null
      return (
        <Card border radius={2} style={{width: 320}}>
          <FilterPopoverContent filter={filter} />
        </Card>
      )
    }
    return (
      <SearchHarness>
        <Stage>
          <Demo />
        </Stage>
      </SearchHarness>
    )
  },
  parameters: {
    docs: {
      description: {
        story:
          "`FilterButton`'s popover body: `FilterForm`, plus two debug panels behind `DEBUG_MODE`. `DEBUG_MODE` is a hardcoded `false` in `constants.ts` (not a runtime flag), so that half of this component never renders in any shipped studio - see Debug Panels for what it would show if it could be turned on.",
      },
    },
  },
}

export const FormBooleanField: Story = {
  name: 'FilterForm, a boolean field',
  render: () => {
    function Demo() {
      const filter = useFieldFilter('featured', true)
      if (!filter) return null
      return (
        <Card border radius={2} style={{width: 320}}>
          <FilterForm filter={filter} />
        </Card>
      )
    }
    return (
      <SearchHarness>
        <Stage>
          <Demo />
        </Stage>
      </SearchHarness>
    )
  },
  parameters: {
    docs: {
      description: {
        story:
          'The value editor (`Component`, from `operator.inputComponent`) stacks above the title/description/operator row in DOM order, deliberately reversed with `direction="column-reverse"` so the value input is first in the focus order - the comment in `FilterForm.tsx:66` calls this out as intentional, not an accident of flex layout. Boolean has no `filterDefinition.description`, so that card does not appear here; compare against the reference field below, which has one.',
      },
    },
  },
}

export const FormReferenceField: Story = {
  name: 'FilterForm, a reference field',
  render: () => {
    function Demo() {
      const filter = useFieldFilter('author', null)
      if (!filter) return null
      return (
        <>
          {/* Dispatched, not just passed as a prop: `SearchFilterReferenceInput` only searches
              types in `documentTypesNarrowed`, and that field is computed by the reducer from
              `state.filters`, not from whatever object happens to be handed to `FilterForm`. */}
          <SeedSearchState filters={[filter]} />
          <Card border radius={2} style={{width: 320}}>
            <FilterForm filter={filter} />
          </Card>
        </>
      )
    }
    return (
      <SearchHarness>
        <Stage minHeight={520}>
          <Demo />
        </Stage>
      </SearchHarness>
    )
  },
  parameters: {
    docs: {
      description: {
        story:
          "`author` is a field on `Article`, referencing `Author`, so adding this filter narrows `documentTypesNarrowed` to `['article']` - and `SearchFilterReferenceInput` reads that narrowed type back through the schema to find what the field can actually reference, arriving at `Author`. Its value editor is therefore a live autocomplete over the fixture Content Lake, not a static control: type into it on canvas and it searches `author-ada`, `author-bo`, `author-mira` for real, the same query engine the results list uses. The remove button (trash icon, top right) only appears in the full-screen layout; the popover form relies on `FilterButton`'s separate close card instead (see above).",
      },
    },
  },
}

export const ErrorFallback: Story = {
  name: 'FilterError',
  render: () => (
    <SearchHarness>
      <Stage minHeight={220}>
        <Card border radius={2} style={{width: 320}}>
          <FilterError padding={4} />
        </Card>
      </Stage>
    </SearchHarness>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '`FilterForm.tsx:62-64` swaps to exactly this component the moment its `ErrorBoundary` catches: `if (errorParams) return <FilterError padding={4} />`. Shown here as the standalone renderer it is (an icon, a title, a description, all critical-toned) rather than staged by forcing an operator input to throw - the wiring is a two-line citation, checkable by reading the source at that line, not a claim about which input crashes or when.',
      },
    },
  },
}

// ---------------------------------------------------------------------------
// OperatorsMenuButton: switching operators without leaving the form
// ---------------------------------------------------------------------------

function useResolvedOperator(filter?: SearchFilter) {
  const {
    state: {definitions},
  } = useSearchState()
  return filter ? getOperatorDefinition(definitions.operators, filter.operatorType) : undefined
}

// Module scope, not nested in `render`: same reasoning as `IncompleteFilterDemo` above - the docs
// branch makes that render a named component, and a component defined inside another is remounted
// on every parent render.
function OperatorsMenuDemo() {
  const filter = useFieldFilter('title', 'release')
  const operator = useResolvedOperator(filter)
  if (!filter) return null
  return <OperatorsMenuButton filter={filter} operator={operator} />
}

export const OperatorsMenu: Story = {
  name: 'OperatorsMenuButton, multiple operators',
  // `play` (below) opens the menu by clicking the "contains" trigger, and skips docs mode - so
  // the docs page rendered the closed button under a heading that never said "closed", reading
  // as though nothing about the multiple-operators claim was visible. Same `OverlayStoryNotice`
  // stand-in `ButtonIncomplete` above already uses.
  render: function OperatorsMenuRender(_args, {viewMode, id, name}) {
    if (viewMode === 'docs') return <OverlayStoryNotice title={name} storyId={id} />
    return (
      <SearchHarness>
        <Stage minHeight={360}>
          <OperatorsMenuDemo />
        </Stage>
      </SearchHarness>
    )
  },
  play: async ({canvasElement, viewMode}) => {
    if (viewMode === 'docs') return
    const canvas = within(canvasElement)
    // Assert the LABEL, not the operator's internal name. Both assertions here used to name the
    // type (`stringMatches`, `notDefined`), and neither string is ever rendered: the operator
    // resolves its label through `nameKey`, and `stringMatches` points at
    // `search.operator.string-contains.name`, which is "contains" (stringOperators.ts:36-44,
    // studio.ts:2174). So the first `findByRole` timed out on every load and the play never
    // reached the second line. The docblock below carried the same mistake and now lists what a
    // reader actually sees.
    await userEvent.click(await canvas.findByRole('button', {name: /contains/i}))
    const body = within(canvasElement.ownerDocument.body)
    await body.findByText('does not contain')
  },
  parameters: {
    docs: {
      description: {
        story:
          '`title` is a `string` filter, one of the definitions with the most operators - contains, does not contain, is, is not, not empty, empty - separated by dividers into three groups. Opened here (canvas view) to show `pressed` on the current selection, the same treatment a selected menu item gets everywhere else in the studio.',
      },
    },
  },
}

export const OperatorsMenuUnresolved: Story = {
  name: 'OperatorsMenuButton, no operator resolved',
  render: () => {
    function Demo() {
      const filter = useFieldFilter('title', 'release')
      if (!filter) return null
      // A deliberately impossible prop, not a reachable filter state: every filter definition
      // shipped today carries at least two real operator items, so `operator === undefined` with
      // a well-formed filter cannot currently happen through the UI. The guard in
      // `OperatorsMenuButton.tsx:59` still exists - `if (!operator || ...) return null` - and this
      // reaches it directly, the way a stale `operatorType` pointing at a removed operator would.
      return <OperatorsMenuButton filter={filter} operator={undefined} />
    }
    return (
      <SearchHarness>
        <Stage minHeight={160}>
          <Text muted size={1}>
            Renders nothing below this line - the component returns null.
          </Text>
          <Demo />
        </Stage>
      </SearchHarness>
    )
  },
  parameters: {
    docs: {
      description: {
        story:
          "`if (!operator || !operatorItems || operatorItems.length <= 1) return null`. No filter definition in the current registry has fewer than two real operator items (every one of them separates at least a value comparison from a defined/not-defined pair), so this guard cannot be reached today through any value this harness can seed by dispatching real state - only by handing the component an `operator` it would never actually receive. Kept as its own story because the branch is real code, not because the state is reachable; see `stories/search/filters/DebugPanels.stories.tsx` for the harness's other 'real but unreachable' case.",
      },
    },
  },
}
