import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {useSchema} from '../../../../../packages/sanity/src/core/hooks/useSchema'
import {
  SearchButtonValueDate,
  SearchButtonValueDateLast,
  SearchButtonValueDateRange,
  SearchButtonValueReference,
} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/common/ButtonValue'
import {ReferencePreviewTitle} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/common/ReferencePreviewTitle'
import {SearchHarness, WithSearchProviders} from '../../../lib/searchHarness'

const meta: Meta = {
  title: 'Search/Filter Button Values',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'An active filter shows a short, read-only summary in its own pill and label: a date, ' +
            'a range, a relative window, a resolved document title. Four small renderers, one ' +
            'per value shape, cover the whole set.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/studio/components/navbar/search/components/filters/common/ButtonValue.tsx` (all four exports), `.../ReferencePreviewTitle.tsx` |',
          '| Tier | SERVICE |',
          '| Audit | ⚪ not-audited |',
          '| Patterns | `filters` |',
          '',
          'The filter label, see Filter Chrome, is the only place any of these actually mount; ' +
            'this page pins the four value shapes on their own.',
          '',
          '> **Why it matters:** every one of these has a null branch, and the null branch ' +
            'renders nothing at all, not a placeholder. Two return nothing for an invalid or ' +
            'incomplete value, and the reference renderer returns nothing for a document type ' +
            'the fixture schema does not know. A filter pill showing blank space instead of a ' +
            'value is easy to misread as no filter at all, when the truth is a value the button ' +
            'cannot render.',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:search', 'pattern:filters', 'audit:not-audited', 'source:studio', 'tier:service'],
  decorators: [WithSearchProviders()],
}

export default meta
type Story = StoryObj

function Row({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <Flex align="center" gap={4}>
      <Card padding={2} radius={2} tone="transparent" style={{width: 220, flexShrink: 0}}>
        <Text muted size={1}>
          {label}
        </Text>
      </Card>
      <Card border padding={3} radius={2} style={{minWidth: 180}}>
        <Text size={1}>{children}</Text>
      </Card>
    </Flex>
  )
}

export const DateValue: Story = {
  name: 'SearchButtonValueDate',
  render: () => (
    <SearchHarness>
      <Stack gap={3} style={{maxWidth: 520}}>
        <Row label="date only">
          <SearchButtonValueDate value={{date: '2026-07-01', includeTime: false}} />
        </Row>
        <Row label="date and time (includeTime: true)">
          <SearchButtonValueDate value={{date: '2026-07-01T14:30:00.000Z', includeTime: true}} />
        </Row>
        <Row label="no date set (renders nothing)">
          <SearchButtonValueDate value={{date: null}} />
        </Row>
      </Stack>
    </SearchHarness>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Backs `dateAfter`, `dateBefore`, `dateEqual` and `dateNotEqual`, and their datetime siblings - every operator whose value is a single point in time. `date-fns/isValid` gates the render: an unset or malformed `date` produces `null`, shown here as the third row, which is genuinely empty, not a dash or a placeholder string.',
      },
    },
  },
}

export const DateRangeValue: Story = {
  name: 'SearchButtonValueDateRange',
  render: () => (
    <SearchHarness>
      <Stack gap={3} style={{maxWidth: 520}}>
        <Row label="a complete range">
          <SearchButtonValueDateRange value={{from: '2026-07-01', to: '2026-07-25'}} />
        </Row>
        <Row label="missing the end date (renders nothing)">
          <SearchButtonValueDateRange value={{from: '2026-07-01', to: null}} />
        </Row>
      </Stack>
    </SearchHarness>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Backs `dateRange` and `dateTimeRange`. Both ends of the range are required for anything to render at all - the component checks `!endDate || !startDate` before formatting either one, so a range with only a start date (the state the two-step range picker sits in between selecting its first and second day) shows nothing rather than a half-built "Jul 1 → ".',
      },
    },
  },
}

export const DateLastValue: Story = {
  name: 'SearchButtonValueDateLast',
  render: () => (
    <SearchHarness>
      <Stack gap={3} style={{maxWidth: 520}}>
        <Row label="7 days">
          <SearchButtonValueDateLast value={{unit: 'day', unitValue: 7}} />
        </Row>
        <Row label="3 months">
          <SearchButtonValueDateLast value={{unit: 'month', unitValue: 3}} />
        </Row>
        <Row label="1 year">
          <SearchButtonValueDateLast value={{unit: 'year', unitValue: 1}} />
        </Row>
      </Stack>
    </SearchHarness>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Backs `dateLast` ("in the last N days/months/years", the only relative-date ' +
          'operator). Unlike its two siblings above it has no null branch: ' +
          '`Math.floor(value?.unitValue ?? 0)` always produces a number, so an empty operator ' +
          'input would render as "0 days" rather than nothing. `useUnitFormatter` supplies the ' +
          "pluralisation, so '1 year' above does not read '1 years'.",
      },
    },
  },
}

export const ReferenceValue: Story = {
  name: 'SearchButtonValueReference',
  render: () => (
    <SearchHarness>
      <Stack gap={3} style={{maxWidth: 520}}>
        <Row label="resolves to a known document">
          <SearchButtonValueReference value={{_type: 'author', _ref: 'author-ada'}} />
        </Row>
        <Row label="a type absent from the schema (renders nothing)">
          <SearchButtonValueReference value={{_type: 'unregistered-type', _ref: 'author-ada'}} />
        </Row>
      </Stack>
    </SearchHarness>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Backs `referenceEqual`, `referenceNotEqual` and the asset-reference operators. The `_type` on this value is the referenced document\'s own type ("author"), not the literal string "reference" a raw `Reference` object usually carries - `ReferenceAutocomplete.handleSelect` sets it from `hit._type` when the value is chosen, and `schema.get(value._type)` here depends on that. `schema.get` returning nothing (second row) is the guard against a stale filter pointing at a type that no longer exists in the workspace.',
      },
    },
  },
}

function ReferencePreviewTitleDemo() {
  const schema = useSchema()
  const authorType = schema.get('author')
  if (!authorType) return null
  return (
    <Stack gap={3} style={{maxWidth: 520}}>
      <Row label="resolved">
        <ReferencePreviewTitle documentId="author-ada" schemaType={authorType} />
      </Row>
      <Row label="unknown id (falls back to a truncated id)">
        <ReferencePreviewTitle documentId="author-does-not-exist" schemaType={authorType} />
      </Row>
    </Stack>
  )
}

export const ReferencePreviewTitleStory: Story = {
  name: 'ReferencePreviewTitle',
  render: () => (
    <SearchHarness>
      <ReferencePreviewTitleDemo />
    </SearchHarness>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'What `SearchButtonValueReference` mounts once a schema type resolves: a live subscription to `getPreviewStateObservable`, rendering a skeleton while `isLoading`, then `snapshot?.title || original?.title`. The fallback matters for the second row - a reference to a document the preview store cannot find still needs to show *something*, and what it shows is the first eight characters of the raw id rather than a blank space or an error.',
      },
    },
  },
}
