import {Card} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {userEvent, within} from 'storybook/test'

import {useSchema} from '../../../../../packages/sanity/src/core/hooks/useSchema'
import {DocumentTypesPopoverContent} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/documentTypes/DocumentTypesPopoverContent'
import {DocumentTypeFilterItem} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/documentTypes/items/DocumentTypeFilterItem'
import {SearchHarness, SeedSearchState, WithSearchProviders} from '../../../lib/searchHarness'

const meta: Meta = {
  title: 'Search/Document Types Menu',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Behind the "All types" (or narrowed-type) button sits a search box over the ' +
            "workspace's selectable document types, partitioned into a Selected group and the " +
            'rest, and the row it is built from.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/studio/components/navbar/search/components/filters/documentTypes/` (`DocumentTypesPopoverContent.tsx`, `items/DocumentTypeFilterItem.tsx`) |',
          '| Tier | SERVICE |',
          '| Audit | ⚪ not-audited |',
          '| Patterns | `filters` |',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:search', 'pattern:filters', 'audit:not-audited', 'source:studio', 'tier:service'],
  decorators: [WithSearchProviders()],
}

export default meta
type Story = StoryObj

export const NoneSelected: Story = {
  name: 'DocumentTypesPopoverContent, nothing selected',
  render: () => (
    <SearchHarness>
      <Card border radius={2} style={{width: 250}}>
        <DocumentTypesPopoverContent />
      </Card>
    </SearchHarness>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The three fixture document types in one flat, unheadered list - `useGetDocumentTypeItems` only inserts a "Selected" header once `itemsSelected.length > 0`, and there is nothing selected yet to earn one. No clear button either, for the same reason: `Filters` in the source components only shows one once `selectedTypes.length > 0`.',
      },
    },
  },
}

export const OneSelected: Story = {
  name: 'DocumentTypesPopoverContent, Article selected',
  render: () => (
    <SearchHarness>
      <SeedSearchState types={['article']} />
      <Card border radius={2} style={{width: 250}}>
        <DocumentTypesPopoverContent />
      </Card>
    </SearchHarness>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'A "Selected" header, `Article` under it with its checkmark, a divider, then `Author` and `Page` unheadered below, and a clear-type-filters button along the bottom edge. The selected/unselected split is a snapshot taken when the popover opens (`selectedTypesSnapshot`), not the live selection - toggling a type inside an already-open popover moves its row between the visual groups only the next time the popover opens, not immediately, so a person can finish a multi-type selection without rows jumping around mid-click.',
      },
    },
  },
}

export const NoMatches: Story = {
  name: 'DocumentTypesPopoverContent, typed filter with no matches',
  render: () => (
    <SearchHarness>
      <Card border radius={2} style={{width: 250}}>
        <DocumentTypesPopoverContent />
      </Card>
    </SearchHarness>
  ),
  play: async ({canvasElement, viewMode}) => {
    if (viewMode === 'docs') return
    const canvas = within(canvasElement)
    const input = await canvas.findByLabelText('Filter by document type')
    await userEvent.type(input, 'zzz-no-such-type')
    await canvas.findByText(/no matches/i)
  },
  parameters: {
    docs: {
      description: {
        story:
          'Typed narrowing against a string no fixture type title contains: `documentTypeItems.length` drops to zero and the `CommandList` is replaced entirely by localized "no matches" copy, the same pattern `AddFilterPopoverContent` uses for its own empty state.',
      },
    },
  },
}

function DocumentTypeFilterItemDemo() {
  const schema = useSchema()
  const articleType = schema.get('article')
  if (!articleType) return null
  return (
    <>
      <DocumentTypeFilterItem selected={false} type={articleType} />
      <DocumentTypeFilterItem selected type={articleType} />
    </>
  )
}

export const Row: Story = {
  name: 'DocumentTypeFilterItem',
  render: () => (
    <SearchHarness>
      <Card border radius={2} style={{width: 250}}>
        <DocumentTypeFilterItemDemo />
      </Card>
    </SearchHarness>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "A row for `Article`, unselected then selected: `selected` only changes the button's tone and whether the checkmark renders as `iconRight` - the click handler (`handleClick`) picks `TERMS_TYPE_ADD` or `TERMS_TYPE_REMOVE` based on the very prop this component takes, so the two rows here are truly the whole state space, not a sample of it.",
      },
    },
  },
}
