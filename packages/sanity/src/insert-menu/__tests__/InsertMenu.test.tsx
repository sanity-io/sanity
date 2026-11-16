import {Schema} from '@sanity/schema'
import {type SchemaType} from '@sanity/types'
import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {type ReactNode} from 'react'
import {describe, expect, test, vi} from 'vitest'

import {InsertMenu, type InsertMenuProps} from '../InsertMenu'

const theme = buildTheme()

function Wrapper({children}: {children: ReactNode}) {
  return (
    <ThemeProvider theme={theme}>
      <LayerProvider>{children}</LayerProvider>
    </ThemeProvider>
  )
}

const schema = Schema.compile({
  name: 'insert-menu-test',
  types: [
    {name: 'hero', type: 'object', fields: [{name: 'title', type: 'string'}]},
    {name: 'figure', type: 'object', fields: [{name: 'title', type: 'string'}]},
    {name: 'video', type: 'object', fields: [{name: 'title', type: 'string'}]},
    {name: 'quote', type: 'object', fields: [{name: 'title', type: 'string'}]},
    {name: 'code', type: 'object', fields: [{name: 'title', type: 'string'}]},
    {name: 'table', type: 'object', fields: [{name: 'title', type: 'string'}]},
  ],
})

const SCHEMA_TYPES: SchemaType[] = ['hero', 'figure', 'video', 'quote', 'code', 'table'].map(
  (name) => schema.get(name)!,
)

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

describe('InsertMenu', () => {
  test('calls onGroupChange when switching tabs', async () => {
    const onGroupChange = vi.fn()
    const user = userEvent.setup()

    render(
      <InsertMenu
        schemaTypes={SCHEMA_TYPES}
        onSelect={() => undefined}
        onGroupChange={onGroupChange}
        groups={GROUPS}
        labels={LABELS}
      />,
      {wrapper: Wrapper},
    )

    const mediaTab = screen.getByRole('tab', {name: 'Media'})
    await user.click(mediaTab)

    expect(onGroupChange).toHaveBeenCalledTimes(1)

    const textTab = screen.getByRole('tab', {name: 'Text'})
    await user.click(textTab)

    expect(onGroupChange).toHaveBeenCalledTimes(2)
  })

  test('does not fail when onGroupChange is not provided', async () => {
    const user = userEvent.setup()

    render(
      <InsertMenu
        schemaTypes={SCHEMA_TYPES}
        onSelect={() => undefined}
        groups={GROUPS}
        labels={LABELS}
      />,
      {wrapper: Wrapper},
    )

    const mediaTab = screen.getByRole('tab', {name: 'Media'})
    await user.click(mediaTab)

    expect(screen.getByRole('tab', {name: 'Media', selected: true})).toBeInTheDocument()
  })
})
