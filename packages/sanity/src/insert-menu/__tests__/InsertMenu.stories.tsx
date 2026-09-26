import {BlockquoteIcon} from '@sanity/icons/Blockquote'
import {CodeBlockIcon} from '@sanity/icons/CodeBlock'
import {ImageIcon} from '@sanity/icons/Image'
import {LinkIcon} from '@sanity/icons/Link'
import {PlayIcon} from '@sanity/icons/Play'
import {StarIcon} from '@sanity/icons/Star'
import {ThListIcon} from '@sanity/icons/ThList'
import {Schema} from '@sanity/schema'
import {type SchemaType} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import noop from 'lodash-es/noop.js'
import {type ComponentType} from 'react'
import {Flex} from 'ui5'

import {InsertMenu, type InsertMenuProps} from '../InsertMenu'

const BLOCKS: Array<[name: string, title: string, icon: ComponentType]> = [
  ['hero', 'Hero', StarIcon],
  ['figure', 'Image', ImageIcon],
  ['video', 'Video', PlayIcon],
  ['quote', 'Quote', BlockquoteIcon],
  ['code', 'Code', CodeBlockIcon],
  ['table', 'Table', ThListIcon],
  ['link', 'Link', LinkIcon],
]

const schema = Schema.compile({
  name: 'insert-menu-story',
  types: BLOCKS.map(([name, title, icon]) => ({
    name,
    title,
    icon,
    type: 'object',
    fields: [{name: 'title', type: 'string'}],
  })),
})

const SCHEMA_TYPES: SchemaType[] = BLOCKS.map(([name]) => schema.get(name)!)

// The array input and Portable Text toolbar pass the `inputs.array.insert-menu.*`
// studio strings through as labels; fixed copy keeps the story hermetic.
const LABELS: InsertMenuProps['labels'] = {
  'insert-menu.filter.all-items': 'All',
  'insert-menu.search.no-results': 'No items found',
  'insert-menu.search.placeholder': 'Search',
  'insert-menu.toggle-grid-view.tooltip': 'Toggle grid view',
  'insert-menu.toggle-list-view.tooltip': 'Toggle list view',
}

const GROUPS: InsertMenuProps['groups'] = [
  {name: 'media', title: 'Media', of: ['figure', 'video']},
  {name: 'text', title: 'Text', of: ['quote', 'code']},
]

const MENU_STYLE = {width: 280}

/**
 * The menu the array input's "Add item" button and the Portable Text
 * toolbar's insert buttons open, rendered outside its popover. Vendored from
 * app-frontend, so it uses `@sanity/ui` primitives directly rather than the
 * studio `ui-components` wrappers.
 */
const meta = {
  title: 'Insert Menu/Insert Menu',
  component: InsertMenu,
} satisfies Meta<typeof InsertMenu>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Chromatic sentinel for the list and grid results after the ui5
 * Stack-to-Flex migration: the `gap` between list rows, the tab strip and
 * search field above them, and the grid's tile spacing and icon placeholders.
 * The bare list (fewer than six types, so `filter: 'auto'` hides the search
 * field and no groups) is the shape most array fields see.
 */
export const Views: Story = {
  args: {labels: LABELS, onSelect: noop, schemaTypes: SCHEMA_TYPES},
  render: (args) => (
    <Card padding={4}>
      <Flex alignItems="flex-start" gap={5}>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            list
          </Text>
          <Card radius={2} shadow={2} style={MENU_STYLE}>
            <InsertMenu {...args} schemaTypes={SCHEMA_TYPES.slice(0, 4)} />
          </Card>
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            list with search and groups
          </Text>
          <Card radius={2} shadow={2} style={MENU_STYLE}>
            <InsertMenu {...args} groups={GROUPS} views={[{name: 'list'}, {name: 'grid'}]} />
          </Card>
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            grid with search and groups
          </Text>
          <Card radius={2} shadow={2} style={MENU_STYLE}>
            <InsertMenu {...args} groups={GROUPS} views={[{name: 'grid'}, {name: 'list'}]} />
          </Card>
        </Stack>
      </Flex>
    </Card>
  ),
}
