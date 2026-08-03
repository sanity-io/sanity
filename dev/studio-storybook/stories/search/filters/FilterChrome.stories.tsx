import {Box, Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useCallback, useState} from 'react'

import {FilterDetails} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/common/FilterDetails'
import {FilterIcon} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/common/FilterIcon'
import {FilterPopoverContentHeader} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/common/FilterPopoverContentHeader'
import {FilterPopoverWrapper} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/common/FilterPopoverWrapper'
import {type SearchFilter} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/types'
import {SearchHarness, useFieldFilter, WithSearchProviders} from '../../../lib/searchHarness'

const meta: Meta = {
  title: 'Search/Filter Chrome',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Every filter popover is assembled from small pieces that are not the popover itself: ' +
            "an operator icon, the path-and-name label above a filter's form, a search header " +
            'the Add Filter and Document Types popovers both reuse, and a focus-locked card ' +
            'wrapper. None of them run a search or hold state of their own; they render whatever ' +
            'they are handed.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/studio/components/navbar/search/components/filters/common/` (`FilterIcon.tsx`, `FilterDetails.tsx`, `FilterPopoverContentHeader.tsx`, `FilterPopoverWrapper.tsx`) |',
          '| Tier | SERVICE |',
          '| Audit | ⚪ not-audited |',
          '| Patterns | `filters` |',
          '',
          '> **Why it matters:** the icon and the details both resolve their content by looking ' +
            'a filter up in the live, schema-derived definitions rather than reading anything off ' +
            'the filter object itself beyond its name. A filter whose name no longer matches any ' +
            'definition, a stale one carried over from a schema that has since changed, does not ' +
            'throw or show an error glyph, it falls back silently to a generic icon and a blank ' +
            'title. Distinguishing that from a filter that genuinely has no icon takes reading ' +
            'the fallback, not looking at it.',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:search', 'pattern:filters', 'audit:not-audited', 'source:studio', 'tier:service'],
  decorators: [WithSearchProviders()],
}

export default meta
type Story = StoryObj

const UNKNOWN_FILTER: SearchFilter = {
  fieldId: 'does-not-exist',
  filterName: 'a-filter-name-no-definition-has',
  operatorType: 'equal',
}

function IconRow({label, filter}: {label: string; filter?: SearchFilter}) {
  if (!filter) return null
  return (
    <Card border padding={3} radius={2}>
      <Text muted size={1}>
        {label}
      </Text>
      <Box marginTop={2}>
        <Text size={3}>
          <FilterIcon filter={filter} />
        </Text>
      </Box>
    </Card>
  )
}

function FilterIconDemo() {
  const titleFilter = useFieldFilter('title', 'release')
  return (
    <Stack gap={3} style={{maxWidth: 420}}>
      <IconRow label="a resolved filter (string field: Title)" filter={titleFilter} />
      <IconRow label="an unresolvable filter, no matching definition" filter={UNKNOWN_FILTER} />
    </Stack>
  )
}

export const Icon: Story = {
  name: 'FilterIcon',
  render: () => (
    <SearchHarness>
      <FilterIconDemo />
    </SearchHarness>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "`getFilterDefinition(definitions.filters, filter.filterName)?.icon` is the entire component: found, it renders that icon; not found, it falls back to `UnknownIcon`. The second row above hands it a filter object naming a filter that does not exist in the fixture schema's derived definitions, reaching the fallback the honest way rather than asserting it from the source.",
      },
    },
  },
}

function DetailsRow({label, filter}: {label: string; filter?: SearchFilter}) {
  if (!filter) return null
  return (
    <Card border padding={3} radius={2}>
      <Text muted size={1}>
        {label}
      </Text>
      <Box marginTop={2}>
        <FilterDetails filter={filter} />
      </Box>
    </Card>
  )
}

function FilterDetailsDemo() {
  const topLevelFilter = useFieldFilter('title', 'release')
  const nestedFilter = useFieldFilter('seo.metaTitle', 'Untitled')
  return (
    <Stack gap={3} style={{maxWidth: 420}}>
      <DetailsRow
        label="a top-level field (titlePath length 1: no breadcrumb)"
        filter={topLevelFilter}
      />
      <DetailsRow
        label="a nested field, Page → SEO → Meta title (titlePath length 2: breadcrumb shown)"
        filter={nestedFilter}
      />
    </Stack>
  )
}

export const Details: Story = {
  name: 'FilterDetails',
  render: () => (
    <SearchHarness>
      <FilterDetailsDemo />
    </SearchHarness>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The icon plus the field's title, with an optional breadcrumb above it: `fieldDefinition.titlePath.slice(0, -1)` - every path segment except the last, which is the name shown on the main line. Every other field in the fixture schema sits directly on its document (titlePath length 1), so the second row seeds a filter against `page.seo.metaTitle`, a nested object field added to the fixture schema specifically so this branch has something real to render rather than being asserted from source alone.",
      },
    },
  },
}

function FilterPopoverContentHeaderDemo() {
  const [value, setValue] = useState('')
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setValue(e.currentTarget.value),
    [],
  )
  const handleClear = useCallback(() => setValue(''), [])
  return (
    <Card border radius={2} style={{width: 300}}>
      <FilterPopoverContentHeader
        ariaInputLabel="Filter by title"
        onChange={handleChange}
        onClear={handleClear}
        typeFilter={value}
      />
    </Card>
  )
}

export const PopoverContentHeader: Story = {
  name: 'FilterPopoverContentHeader',
  render: () => (
    <SearchHarness>
      <FilterPopoverContentHeaderDemo />
    </SearchHarness>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The search box both the Add Filter and Document Types popovers open with, in isolation. Not just a `TextInput`: it wraps `CustomTextInput` for the shared clear-button styling, and its own clear button (`clearButton={!!typeFilter}`) only renders once there is something to clear. Type into the field on canvas to watch the button appear.',
      },
    },
  },
}

function FilterPopoverWrapperDemo() {
  const [open, setOpen] = useState(true)
  const [anchor, setAnchor] = useState<HTMLDivElement | null>(null)
  const handleClose = useCallback(() => setOpen(false), [])
  return (
    <Box style={{position: 'relative', height: 260}}>
      <div ref={setAnchor} style={{position: 'absolute', top: 40, left: 40, width: 1, height: 1}} />
      {open ? (
        <FilterPopoverWrapper anchorElement={anchor} onClose={handleClose}>
          <Box padding={4} style={{width: 280}}>
            <Text size={1}>
              Any filter form renders here. Click outside this card, or press Escape, to close it.
            </Text>
          </Box>
        </FilterPopoverWrapper>
      ) : (
        <Card border padding={3} radius={2} tone="caution" style={{width: 280}}>
          <Text size={1}>Closed. Reload the story to reopen it.</Text>
        </Card>
      )}
    </Box>
  )
}

export const PopoverWrapper: Story = {
  name: 'FilterPopoverWrapper',
  render: () => (
    <SearchHarness>
      <FilterPopoverWrapperDemo />
    </SearchHarness>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The focus-locked card every filter's popover content sits inside - `FilterButton` renders `FilterPopoverContent` through exactly this wrapper. It is not much on its own: a `HiddenOverlay` that closes on click, a `FocusLock`, and a `Card` capped at 500px tall and clamped to the viewport below its anchor. What makes it worth its own story is that both dismissal paths (the overlay click and the Escape key, gated on `useLayer().isTopLayer` so only the frontmost popover responds) are real here, not simulated.",
      },
    },
  },
}
