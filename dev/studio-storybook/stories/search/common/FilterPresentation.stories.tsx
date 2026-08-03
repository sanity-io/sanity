import {Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {useSchema} from '../../../../../packages/sanity/src/core/hooks/useSchema'
import {CustomTextInput} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/common/CustomTextInput'
import {DocumentTypesPill} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/common/DocumentTypesPill'
import {FilterLabel} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/common/FilterLabel'
import {FilterPill} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/common/FilterPill'
import {FilterTitle} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/common/FilterTitle'
import {type SearchFilter} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/types'
import {SearchHarness, useFieldFilter, WithSearchProviders} from '../../../lib/searchHarness'

const meta: Meta = {
  title: 'Search/Filter Presentation',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Once a filter leaves its own popover, five small pieces are what show it: the pill ' +
            'on the filter bar, the label inside that pill, a plain title reused in the Add ' +
            'Filter menu, a shared search input, and a read-only type-count summary on a recent ' +
            'search.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/studio/components/navbar/search/components/common/` (`FilterTitle.tsx`, `FilterLabel.tsx`, `FilterPill.tsx`, `DocumentTypesPill.tsx`, `CustomTextInput.tsx`) |',
          '| Tier | SERVICE |',
          '| Audit | ⚪ not-audited |',
          '| Patterns | `filters` |',
          '',
          '> **Why it matters:** the filter label is not one component with one layout, it is a ' +
            'translation string with three named slots spliced in for the field, the operator ' +
            'and the value, and a content flag collapses two of those slots to nothing. The ' +
            'filter button passes that flag only once a filter is valid, so an incomplete filter, ' +
            'the moment right after picking one from the menu and before a value is set, shows ' +
            'only the field name on purpose. Showing "Title contains" with a blank value would ' +
            'read as broken rather than unfinished.',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:search', 'pattern:filters', 'audit:not-audited', 'source:studio', 'tier:service'],
  decorators: [WithSearchProviders()],
}

export default meta
type Story = StoryObj

const EDITED_AT_LAST_7_DAYS: SearchFilter = {
  filterName: 'updatedAt',
  operatorType: 'dateTimeLast',
  value: {unit: 'day', unitValue: 7},
}

function LabelRow({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <Stack gap={2}>
      <Text muted size={1}>
        {label}
      </Text>
      {children}
    </Stack>
  )
}

function FilterTitleDemo() {
  const titleFilter = useFieldFilter('title', 'release')
  const longFilter = useFieldFilter('title', 'a long value does not affect this')
  return (
    <Stack gap={3} style={{maxWidth: 420}}>
      <LabelRow label="a field filter">
        {titleFilter && <FilterTitle filter={titleFilter} />}
      </LabelRow>
      <LabelRow label="a pinned filter (no field behind it)">
        <FilterTitle filter={EDITED_AT_LAST_7_DAYS} />
      </LabelRow>
      <LabelRow label="truncated to 6 characters (maxLength)">
        {longFilter && <FilterTitle filter={longFilter} maxLength={6} />}
      </LabelRow>
    </Stack>
  )
}

export const Title: Story = {
  name: 'FilterTitle',
  render: () => (
    <SearchHarness>
      <FilterTitleDemo />
    </SearchHarness>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The plain name of a filter, with no operator or value: the `switch` on `filterDef?.type` picks either the resolved field's last `titlePath` segment (a field filter) or the filter definition's own `title` (a pinned one, which has no field to derive a name from). `maxLength` is a hard character cut with an ellipsis appended, used by `FilterLabel`'s full-width layout to keep a long field name from pushing the operator and value out of the pill.",
      },
    },
  },
}

function FilterLabelDemo() {
  const titleFilter = useFieldFilter('title', 'release')
  const featuredFilter = useFieldFilter('featured', true)
  const incompleteFilter = useFieldFilter('title', undefined)
  return (
    <Stack gap={3} style={{maxWidth: 420}}>
      <LabelRow label="a string filter with a value: 'Title contains release'">
        {titleFilter && <FilterLabel filter={titleFilter} />}
      </LabelRow>
      <LabelRow label="a boolean filter: 'Featured is True'">
        {featuredFilter && <FilterLabel filter={featuredFilter} />}
      </LabelRow>
      <LabelRow label="a pinned date filter: 'Edited at in the last 7 days'">
        <FilterLabel filter={EDITED_AT_LAST_7_DAYS} />
      </LabelRow>
      <LabelRow label="showContent=false: field name only, no operator or value">
        {incompleteFilter && <FilterLabel filter={incompleteFilter} showContent={false} />}
      </LabelRow>
    </Stack>
  )
}

export const Label: Story = {
  name: 'FilterLabel',
  render: () => (
    <SearchHarness>
      <FilterLabelDemo />
    </SearchHarness>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The sentence inside a filter pill, built from the operator\'s `descriptionKey` translation with `Field`, `Operator` and `Value` spliced in as React components rather than plain string interpolation - `Value` in particular renders the operator\'s own `buttonValueComponent` (see Filter Button Values), not a generic stringification. The fourth row is the state `FilterButton` reaches for an incomplete filter: `showContent={false}` collapses the sentence down to the bare `Field` slot, which is the honest way to say "this filter is not finished yet" rather than rendering a sentence with a hole in it.',
      },
    },
  },
}

export const Pill: Story = {
  name: 'FilterPill',
  render: () => {
    function Demo() {
      const titleFilter = useFieldFilter('title', 'release')
      const featuredFilter = useFieldFilter('featured', true)
      return (
        <Flex gap={2} wrap="wrap">
          {titleFilter && <FilterPill filter={titleFilter} />}
          {featuredFilter && <FilterPill filter={featuredFilter} />}
          <FilterPill filter={EDITED_AT_LAST_7_DAYS} />
        </Flex>
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
          '`FilterLabel` inside a bordered, primary-tone card: the read-only shape a filter takes in a recent search entry (see Recent Search Item), as opposed to `FilterButton`, which wraps the same label in an interactive, openable control. `cursor: default` on the card is deliberate - this pill is not clickable, unlike its counterpart on the live filter bar.',
      },
    },
  },
}

function DocumentTypesPillDemo() {
  const schema = useSchema()
  const types = [schema.get('article'), schema.get('author'), schema.get('page')].filter(
    (t): t is NonNullable<typeof t> => !!t,
  )
  return (
    <Stack gap={3} style={{maxWidth: 420}}>
      <LabelRow label="plenty of room: all three types fit">
        <DocumentTypesPill availableCharacters={80} types={types} />
      </LabelRow>
      <LabelRow label="not enough room: truncated with a +N more suffix">
        <DocumentTypesPill availableCharacters={14} types={types} />
      </LabelRow>
      <LabelRow label="no types (renders the component's own empty-state copy)">
        <DocumentTypesPill types={[]} />
      </LabelRow>
    </Stack>
  )
}

export const TypesPill: Story = {
  name: 'DocumentTypesPill',
  render: () => (
    <SearchHarness>
      <DocumentTypesPillDemo />
    </SearchHarness>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '`documentTypesTruncated` decides the string, this component just wraps it in a muted pill: `RecentSearchItem` is the one place that mounts it. The first type is always kept regardless of length (so a single long type name is never dropped entirely), the rest are added only while they still fit `availableCharacters`, and what does not fit collapses into a localized "+N more" rather than being silently cut.',
      },
    },
  },
}

export const TextInputVariants: Story = {
  name: 'CustomTextInput',
  render: () => (
    <SearchHarness>
      <Stack gap={3} style={{maxWidth: 420}}>
        <LabelRow label="plain (a bare TextInput underneath)">
          <Card border padding={2} radius={2}>
            <TextInput placeholder="Ordinary TextInput, for comparison" />
          </Card>
        </LabelRow>
        <LabelRow label="CustomTextInput: adds $background and a resized clear button">
          <CustomTextInput
            $background
            $smallClearButton
            clearButton
            defaultValue="release"
            onClear={() => undefined}
            placeholder="Filter by title"
          />
        </LabelRow>
      </Stack>
    </SearchHarness>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "A `TextInput` wrapped in `CustomTextInputBox`, which exists for exactly two CSS hooks used across the filter chrome: `$background` swaps the clear button's backdrop from transparent to the card's disabled-bg tone (used where the input sits on a plain surface rather than inside its own bordered card), and `$smallClearButton` scales the clear button down for the tighter popover headers (see `FilterPopoverContentHeader`). Neither prop changes behaviour, only the two places' visual fit.",
      },
    },
  },
}
