import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {DocumentIcon} from '@sanity/icons/Document'
import {SearchIcon} from '@sanity/icons/Search'
import {Badge, Box, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ReactNode, useMemo, useState} from 'react'
import {expect, userEvent, waitFor, within} from 'storybook/test'

import {CommandList} from '../CommandList'
import {type CommandListItemContext} from '../types'

interface Row {
  id: string
  title: string
  type: string
}

const DOCUMENTS: Row[] = [
  {id: 'doc-1', title: 'Anna Karenina', type: 'book'},
  {id: 'doc-2', title: 'War and Peace', type: 'book'},
  {id: 'doc-3', title: 'Pride and Prejudice', type: 'book'},
  {id: 'doc-4', title: 'The Idiot', type: 'book'},
  {id: 'doc-5', title: 'Leo Tolstoy', type: 'author'},
  {id: 'doc-6', title: 'Jane Austen', type: 'author'},
  {id: 'doc-7', title: 'Fyodor Dostoevsky', type: 'author'},
  {id: 'doc-8', title: 'Autumn campaign', type: 'campaign'},
]

/** 1,200 rows so virtualization is doing real work: only the visible window mounts. */
const LARGE_LIST: Row[] = Array.from({length: 1200}, (_, index) => ({
  id: `row-${index}`,
  title: `Document #${String(index + 1).padStart(4, '0')}`,
  type: ['book', 'author', 'campaign', 'page'][index % 4],
}))

const ITEM_HEIGHT = 45

/** A fixed-height, bordered viewport that the list fills. */
function ListFrame(props: {children: ReactNode; height?: number}) {
  return (
    <Card border overflow="hidden" radius={2} style={{height: props.height ?? 320}}>
      {props.children}
    </Card>
  )
}

/**
 * One row renderer for every story: a `Card as="button"`, the `a,button`
 * interactive element `CommandList` routes Enter-to-activate through and
 * toggles the active-item data attribute on. `activeItemDataAttr="data-hovered"`
 * makes the Card paint its own hovered background as the active index moves.
 */
function renderRow(item: Row, context: CommandListItemContext, showSelection = false) {
  return (
    <Card as="button" padding={3} radius={2}>
      <Flex align="center" gap={3}>
        <Text muted size={2}>
          <DocumentIcon />
        </Text>
        <Box flex={1}>
          <Text size={1} textOverflow="ellipsis">
            {item.title}
          </Text>
        </Box>
        <Badge fontSize={0}>{item.type}</Badge>
        {showSelection && context.selected && (
          <Text size={1}>
            <CheckmarkIcon />
          </Text>
        )}
      </Flex>
    </Card>
  )
}

function renderPlainRow(item: Row, context: CommandListItemContext) {
  return renderRow(item, context)
}

function renderSelectableRow(item: Row, context: CommandListItemContext) {
  return renderRow(item, context, true)
}

function ComboboxStory() {
  const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null)
  const [query, setQuery] = useState('')

  const items = useMemo(
    () => DOCUMENTS.filter((doc) => doc.title.toLowerCase().includes(query.toLowerCase())),
    [query],
  )

  return (
    <Stack gap={3} style={{maxWidth: 480}}>
      <TextInput
        aria-label="Filter documents"
        icon={SearchIcon}
        onChange={(event) => setQuery(event.currentTarget.value)}
        placeholder="Type to filter, then ↑/↓ and Enter"
        ref={setInputElement}
        value={query}
      />
      <ListFrame height={280}>
        {items.length > 0 ? (
          <CommandList
            activeItemDataAttr="data-hovered"
            ariaLabel="Filtered documents"
            autoFocus="input"
            inputElement={inputElement}
            itemHeight={ITEM_HEIGHT}
            items={items}
            padding={1}
            renderItem={renderPlainRow}
          />
        ) : (
          <Flex align="center" height="fill" justify="center" padding={4}>
            <Text muted size={1}>
              No results for “{query}”
            </Text>
          </Flex>
        )}
      </ListFrame>
    </Stack>
  )
}

const SELECTED_IDS: ReadonlySet<string> = new Set(['doc-2', 'doc-5'])

function getItemSelected(index: number) {
  return SELECTED_IDS.has(DOCUMENTS[index].id)
}

/**
 * The virtualized, keyboard-navigable listbox behind global search,
 * `@`-mentions, the new-document picker and faceted filters. It mounts only the
 * rows in view (via `@tanstack/react-virtual`), moves an active index with the
 * arrow keys, activates the row's first `a,button` element on Enter, and
 * exposes the ARIA `listbox` / `combobox` wiring: pass `inputElement` and the
 * input drives the list through `aria-activedescendant`. Rows are rendered
 * through `renderItem`; the list itself never assumes their shape.
 */
const meta = {
  title: 'Studio/Command List',
  component: CommandList,
  args: {
    ariaLabel: 'Documents',
    itemHeight: ITEM_HEIGHT,
    items: DOCUMENTS,
    renderItem: renderPlainRow,
  },
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof CommandList>

export default meta
type Story = StoryObj<typeof meta>

/**
 * A short list that holds focus itself (`canReceiveFocus` + `autoFocus="list"`),
 * so the first row is active on mount.
 */
export const Basic: Story = {
  render: () => (
    <Box style={{maxWidth: 480}}>
      <ListFrame>
        <CommandList
          activeItemDataAttr="data-hovered"
          ariaLabel="Documents"
          autoFocus="list"
          canReceiveFocus
          itemHeight={ITEM_HEIGHT}
          items={DOCUMENTS}
          padding={1}
          renderItem={renderPlainRow}
        />
      </ListFrame>
    </Box>
  ),
}

/**
 * 1,200 rows with `fixedHeight` (skips per-row measurement). Only the visible
 * window plus `overscan` is ever in the DOM while the scroll height reflects
 * the whole list.
 */
export const Virtualized: Story = {
  render: () => (
    <Box style={{maxWidth: 480}}>
      <ListFrame height={400}>
        <CommandList
          activeItemDataAttr="data-hovered"
          ariaLabel="All documents"
          canReceiveFocus
          fixedHeight
          itemHeight={ITEM_HEIGHT}
          items={LARGE_LIST}
          overscan={6}
          padding={1}
          renderItem={renderPlainRow}
        />
      </ListFrame>
    </Box>
  ),
}

/**
 * The `combobox` pattern: a `TextInput` wired through `inputElement` filters
 * the list, ↑/↓ move the active row and Enter activates it without focus ever
 * leaving the field. The `play` function types a filter and moves the active
 * row down once so the snapshot shows the filtered, keyboard-driven state.
 */
export const Combobox: Story = {
  render: () => <ComboboxStory />,
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    // CommandList sets `role="combobox"` on the wired input itself
    const input = canvas.getByRole('combobox', {name: 'Filter documents'})
    await userEvent.type(input, 'to')
    // "to" matches Leo Tolstoy and Fyodor Dostoevsky; the first row is active
    await waitFor(() =>
      expect(input).toHaveAttribute('aria-activedescendant', expect.stringMatching(/-item-0$/)),
    )
    await userEvent.keyboard('{ArrowDown}')
    await waitFor(() =>
      expect(input).toHaveAttribute('aria-activedescendant', expect.stringMatching(/-item-1$/)),
    )
  },
}

/**
 * `ariaMultiselectable` with `getItemSelected`: selection is separate from the
 * active index and is reported both through `aria-selected` and to
 * `renderItem` via `context.selected`.
 */
export const MultiSelect: Story = {
  render: () => (
    <Box style={{maxWidth: 480}}>
      <ListFrame>
        <CommandList
          activeItemDataAttr="data-hovered"
          ariaLabel="Selectable documents"
          ariaMultiselectable
          canReceiveFocus
          getItemSelected={getItemSelected}
          itemHeight={ITEM_HEIGHT}
          items={DOCUMENTS}
          padding={1}
          renderItem={renderSelectableRow}
        />
      </ListFrame>
    </Box>
  ),
}
