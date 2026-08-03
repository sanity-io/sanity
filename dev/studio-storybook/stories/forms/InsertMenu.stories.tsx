import {BlockContentIcon} from '@sanity/icons/BlockContent'
import {BlockElementIcon} from '@sanity/icons/BlockElement'
import {CodeIcon} from '@sanity/icons/Code'
import {DocumentIcon} from '@sanity/icons/Document'
import {DocumentsIcon} from '@sanity/icons/Documents'
import {ImageIcon} from '@sanity/icons/Image'
import {LinkIcon} from '@sanity/icons/Link'
import {OlistIcon} from '@sanity/icons/Olist'
import {StarIcon} from '@sanity/icons/Star'
import {type SchemaType} from '@sanity/types'
import {Card, LayerProvider, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useState} from 'react'

import {InsertMenu} from '../../../../packages/sanity/src/insert-menu/InsertMenu'

const LABELS = {
  'insert-menu.filter.all-items': 'All',
  'insert-menu.search.no-results': 'No results',
  'insert-menu.search.placeholder': 'Filter types',
  'insert-menu.toggle-grid-view.tooltip': 'Grid view',
  'insert-menu.toggle-list-view.tooltip': 'List view',
}

const type = (name: string, title: string, icon?: unknown): SchemaType =>
  ({name, title, type: {name: 'object'}, icon}) as unknown as SchemaType

/** A realistic portable-text block menu: a few blocks, a few inline objects. */
const RICH_TYPES: SchemaType[] = [
  type('image', 'Image', ImageIcon),
  type('video', 'Video embed', DocumentsIcon),
  type('codeBlock', 'Code block', CodeIcon),
  type('table', 'Table', DocumentIcon),
  type('callout', 'Callout', StarIcon),
  type('quote', 'Pull quote', BlockContentIcon),
  type('list', 'Ordered list', OlistIcon),
  type('link', 'Link', LinkIcon),
  type('divider', 'Divider', BlockElementIcon),
]

/** Under the auto-filter threshold of five. */
const FEW_TYPES: SchemaType[] = RICH_TYPES.slice(0, 3)

const GROUPS = [
  {name: 'media', title: 'Media', of: ['image', 'video']},
  {name: 'structure', title: 'Structure', of: ['table', 'list', 'divider']},
  {name: 'text', title: 'Text', of: ['codeBlock', 'callout', 'quote', 'link']},
]

/**
 * `LayerProvider` is required, not decorative. InsertMenu is built on `@sanity/ui`'s `Menu`
 * primitives directly (see the oxlint-disable at the top of its source: the studio ui-components
 * wrappers are not API-compatible here), and `Menu` calls `useLayer()`, which throws outright
 * without a provider above it. Same gotcha the MenuItem stories document.
 */
function Frame({children}: {children: React.ReactNode}) {
  return (
    <LayerProvider>
      <Card border radius={2} shadow={1} style={{width: 300, overflow: 'hidden'}}>
        {children}
      </Card>
    </LayerProvider>
  )
}

const meta: Meta<typeof InsertMenu> = {
  title: 'Forms & Input/InsertMenu',
  component: InsertMenu,
  parameters: {
    docs: {
      description: {
        component: [
          'The automatic filter default is the piece worth studying: rather than always showing ' +
            'a search field or never showing one, the insert menu counts its own options and ' +
            'shows the filter only past five.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/insert-menu/InsertMenu.tsx` |',
          '| Tier | SERVICE |',
          '| Patterns | `progressive-disclosure` |',
          '',
          'The "+" menu in Portable Text and array inputs, the list of things you can insert at ' +
            'this point in the content. Entirely prop-driven: schema types in, a selection out, ' +
            'plus a handful of display options. No context, no store, no schema resolution.',
          '',
          '> **Why it matters:** that threshold is the design. Below it, scanning is faster ' +
            'than typing and a search box is an obstacle between an author and three visible ' +
            'choices; above it, scanning starts to cost more than typing. A menu that adapts to ' +
            'its own content is doing work that would otherwise land on every schema author as a ' +
            'configuration decision they have no basis for making.',
          '',
          'The labels are passed in as a prop, not resolved from i18n inside the component. ' +
            'That is because this menu is vendored, the same source is built into the Sanity app ' +
            'frontend, which has a different translation layer. Handing the strings in keeps one ' +
            'component honest in two applications.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:forms',
    'pattern:progressive-disclosure',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj<typeof InsertMenu>

export const Default: Story = {
  name: 'A short list - no filter',
  parameters: {
    docs: {
      description: {
        story:
          'Three types, under the auto-filter threshold, so no search field appears. Everything is visible; a filter would be a control standing between you and three items you can already read.',
      },
    },
  },
  render: function ShortStory() {
    const [picked, setPicked] = useState<string | null>(null)
    return (
      <Stack gap={3}>
        <Frame>
          <InsertMenu schemaTypes={FEW_TYPES} labels={LABELS} onSelect={(t) => setPicked(t.name)} />
        </Frame>
        <Text size={0} muted>
          {picked ? `selected: ${picked}` : 'nothing selected yet'}
        </Text>
      </Stack>
    )
  },
}

export const AutoFilter: Story = {
  name: 'A long list - the filter appears',
  parameters: {
    docs: {
      description: {
        story:
          'The same component with nine types. Past five, `filter: \'auto\'` turns the search field on by itself. Type "co" and it narrows to Code block alone - the match is a substring test on the title, so "Callout" does not qualify.\n\nCompare with the story above: nothing was configured differently. The menu counted.',
      },
    },
  },
  render: function LongStory() {
    const [picked, setPicked] = useState<string | null>(null)
    return (
      <Stack gap={3}>
        <Frame>
          <InsertMenu
            schemaTypes={RICH_TYPES}
            labels={LABELS}
            onSelect={(t) => setPicked(t.name)}
          />
        </Frame>
        <Text size={0} muted>
          {picked ? `selected: ${picked}` : 'nothing selected yet'}
        </Text>
      </Stack>
    )
  },
}

export const FilterForced: Story = {
  name: 'Filter forced on a short list',
  args: {filter: true},
  parameters: {
    docs: {
      description: {
        story:
          '`filter: true` overrides the count. A schema author who knows their three types have long, similar names might want this - but the default exists because most of them do not, and would be guessing.',
      },
    },
  },
  render: (args) => (
    <Frame>
      <InsertMenu {...args} schemaTypes={FEW_TYPES} labels={LABELS} onSelect={() => undefined} />
    </Frame>
  ),
}

export const FilterForcedOff: Story = {
  name: 'Filter forced off on a long list',
  args: {filter: false},
  parameters: {
    docs: {
      description: {
        story:
          'The inverse: nine types and no search. Storied because it is the configuration most likely to be regretted - the list is scrollable and nothing tells the reader how far it goes.',
      },
    },
  },
  render: (args) => (
    <Frame>
      <InsertMenu {...args} schemaTypes={RICH_TYPES} labels={LABELS} onSelect={() => undefined} />
    </Frame>
  ),
}

export const NoResults: Story = {
  name: 'Nothing matches',
  parameters: {
    docs: {
      description: {
        story:
          'Type something that matches nothing - "zzz" - and the menu says so rather than showing an empty box. An empty menu and a menu with no matches look identical without this, and the difference is whether you should clear the filter or give up.',
      },
    },
  },
  render: () => (
    <Frame>
      <InsertMenu schemaTypes={RICH_TYPES} labels={LABELS} onSelect={() => undefined} />
    </Frame>
  ),
}

export const Grouped: Story = {
  name: 'With groups',
  args: {groups: GROUPS},
  parameters: {
    docs: {
      description: {
        story:
          'Groups render as a row of filter chips above the list, with an "All" chip prepended by the component rather than declared by the schema author.\n\nThey are **filters, not sections**: picking Media narrows the list rather than scrolling to a heading. That is the right choice for a menu that already has a search field - two ways to narrow, one way to read - where sections would give you two ways to read and one way to narrow.',
      },
    },
  },
  render: (args) => (
    <Frame>
      <InsertMenu {...args} schemaTypes={RICH_TYPES} labels={LABELS} onSelect={() => undefined} />
    </Frame>
  ),
}

export const GridView: Story = {
  name: 'Grid view',
  args: {views: [{name: 'grid'}, {name: 'list'}]},
  parameters: {
    docs: {
      description: {
        story:
          'With more than one view configured, a view toggle appears in the header and the first entry wins by default. Grid is for menus where the icon carries the meaning - a set of layout blocks, say - and list is for menus where the name does.\n\nThe grid view also accepts `previewImageUrl` per type, so a schema author can show a thumbnail of what each block looks like instead of a glyph. That is the version worth reaching for when the types are visual.',
      },
    },
  },
  render: (args) => (
    <Frame>
      <InsertMenu {...args} schemaTypes={RICH_TYPES} labels={LABELS} onSelect={() => undefined} />
    </Frame>
  ),
}

export const NoIcons: Story = {
  name: 'Without icons',
  args: {showIcons: false},
  parameters: {
    docs: {
      description: {
        story:
          '`showIcons: false` strips the glyphs. Compare with the default: with icons the list ' +
          'is scannable by shape; without them it is a column of words that all have to be ' +
          'read. The default is on, and this is the story that justifies it.',
      },
    },
  },
  render: (args) => (
    <Frame>
      <InsertMenu {...args} schemaTypes={RICH_TYPES} labels={LABELS} onSelect={() => undefined} />
    </Frame>
  ),
}

export const Everything: Story = {
  name: 'Groups, both views, and a filter',
  args: {groups: GROUPS, views: [{name: 'list'}, {name: 'grid'}], filter: true},
  parameters: {
    docs: {
      description: {
        story:
          'Every option on at once, which is also the point at which to ask whether they should be. Three narrowing mechanisms - search, group chips, and the view toggle - stacked above nine items is more chrome than content.\n\nStoried as a caution rather than a recommendation. The options exist for large, genuinely heterogeneous menus; on a normal one, the auto-filter default and nothing else is the better answer.',
      },
    },
  },
  render: (args) => (
    <Frame>
      <InsertMenu {...args} schemaTypes={RICH_TYPES} labels={LABELS} onSelect={() => undefined} />
    </Frame>
  ),
}
