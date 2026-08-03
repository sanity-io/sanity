import {ArrowRightIcon} from '@sanity/icons/ArrowRight'
import {BoltIcon} from '@sanity/icons/Bolt'
import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {CopyIcon} from '@sanity/icons/Copy'
import {DocumentIcon} from '@sanity/icons/Document'
import {MoonIcon} from '@sanity/icons/Moon'
import {PublishIcon} from '@sanity/icons/Publish'
import {RocketIcon} from '@sanity/icons/Rocket'
import {SearchIcon} from '@sanity/icons/Search'
import {TrashIcon} from '@sanity/icons/Trash'
import {UnpublishIcon} from '@sanity/icons/Unpublish'
import {Badge, Box, Card, Code, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ComponentType, useCallback, useMemo, useState} from 'react'

// Real component from its real path (org contract §8): the virtualized,
// keyboard-navigable listbox that underpins every Studio list/search/command
// surface (global search, @mentions, new-document picker, faceted filters).
import {CommandList} from '../../../../packages/sanity/src/core/components/commandList/CommandList'
import {type CommandListItemContext} from '../../../../packages/sanity/src/core/components/commandList/types'

// --- Fixture model ---------------------------------------------------------

interface DocumentRow {
  kind: 'document'
  id: string
  title: string
  type: string
}

interface CommandRow {
  kind: 'command'
  id: string
  title: string
  icon: ComponentType
  hint: string
}

type Row = DocumentRow | CommandRow

const DOCUMENTS: DocumentRow[] = [
  {kind: 'document', id: 'doc-1', title: 'Anna Karenina', type: 'book'},
  {kind: 'document', id: 'doc-2', title: 'War and Peace', type: 'book'},
  {kind: 'document', id: 'doc-3', title: 'Pride and Prejudice', type: 'book'},
  {kind: 'document', id: 'doc-4', title: 'The Idiot', type: 'book'},
  {kind: 'document', id: 'doc-5', title: 'Leo Tolstoy', type: 'author'},
  {kind: 'document', id: 'doc-6', title: 'Jane Austen', type: 'author'},
  {kind: 'document', id: 'doc-7', title: 'Fyodor Dostoevsky', type: 'author'},
  {kind: 'document', id: 'doc-8', title: 'Autumn 2026 campaign', type: 'campaign'},
]

const COMMANDS: CommandRow[] = [
  {kind: 'command', id: 'cmd-publish', title: 'Publish document', icon: PublishIcon, hint: '⌘⌥P'},
  {kind: 'command', id: 'cmd-duplicate', title: 'Duplicate document', icon: CopyIcon, hint: '⌘⌥D'},
  {
    kind: 'command',
    id: 'cmd-unpublish',
    title: 'Unpublish document',
    icon: UnpublishIcon,
    hint: '',
  },
  {kind: 'command', id: 'cmd-deploy', title: 'Deploy Studio', icon: RocketIcon, hint: ''},
  {kind: 'command', id: 'cmd-theme', title: 'Toggle color scheme', icon: MoonIcon, hint: ''},
  {kind: 'command', id: 'cmd-delete', title: 'Delete document', icon: TrashIcon, hint: ''},
]

/** 1,200 rows so virtualization is doing real work: only the visible window mounts. */
const LARGE_LIST: DocumentRow[] = Array.from({length: 1200}, (_, i) => ({
  kind: 'document',
  id: `row-${i}`,
  title: `Document #${String(i + 1).padStart(4, '0')}`,
  type: ['book', 'author', 'campaign', 'page'][i % 4],
}))

/** Long alphabetical set for the jump-to-item story. */
const ALPHA_NAMES = [
  'Achebe',
  'Austen',
  'Baldwin',
  'Borges',
  'Brontë',
  'Calvino',
  'Camus',
  'Dostoevsky',
  'Eliot',
  'Faulkner',
  'García Márquez',
  'Hemingway',
  'Ishiguro',
  'Joyce',
  'Kafka',
  'Le Guin',
  'Morrison',
  'Nabokov',
  'Orwell',
  'Proust',
  'Rushdie',
  'Steinbeck',
  'Tolstoy',
  'Updike',
  'Woolf',
  'Zola',
]
const ALPHA_LIST: DocumentRow[] = ALPHA_NAMES.flatMap((surname) =>
  Array.from({length: 8}, (_, i) => ({
    kind: 'document' as const,
    id: `${surname}-${i}`,
    title: `${surname}, work ${i + 1}`,
    type: 'book',
  })),
)

const ITEM_HEIGHT = 45

// --- Presentational helpers ------------------------------------------------

/** A fixed-height, bordered viewport for the list, which CommandList fills 100%. */
function ListFrame(props: {children: React.ReactNode; height?: number}) {
  return (
    <Card border radius={2} overflow="hidden" style={{height: props.height ?? 360}}>
      {props.children}
    </Card>
  )
}

function Readout(props: {label: string; value: string}) {
  return (
    <Card border padding={3} radius={2} tone="transparent">
      <Stack gap={2}>
        <Text size={0} muted weight="medium">
          {props.label}
        </Text>
        <Code size={1}>{props.value}</Code>
      </Stack>
    </Card>
  )
}

/**
 * One row renderer for every story. Returns a single `Card as="button"`, the
 * `a,button` interactive element CommandList looks for to route Enter-to-activate
 * and to toggle the active-state data attribute. `activeItemDataAttr="data-hovered"`
 * (below) makes Sanity UI's Card paint its own hovered background as focus moves,
 * exactly as the real call sites do.
 */
function renderRow(
  item: Row,
  context: CommandListItemContext,
  onActivate: (item: Row) => void,
  options: {showSelection?: boolean} = {},
) {
  const Icon = item.kind === 'command' ? item.icon : DocumentIcon
  return (
    <Card
      as="button"
      radius={2}
      padding={3}
      onClick={() => onActivate(item)}
      tone={item.kind === 'command' ? 'primary' : 'default'}
    >
      <Flex align="center" gap={3}>
        <Text size={2} muted={item.kind === 'document'}>
          <Icon />
        </Text>
        <Box flex={1}>
          <Text size={1} textOverflow="ellipsis">
            {item.title}
          </Text>
        </Box>
        {item.kind === 'document' && (
          <Badge fontSize={0} tone="default">
            {item.type}
          </Badge>
        )}
        {item.kind === 'command' && item.hint && (
          <Text size={0} muted>
            {item.hint}
          </Text>
        )}
        {options.showSelection && context.selected && (
          <Text size={1}>
            <CheckmarkIcon />
          </Text>
        )}
      </Flex>
    </Card>
  )
}

// --- Meta ------------------------------------------------------------------

const meta: Meta = {
  title: 'Actions & Commands/CommandList',
  parameters: {
    // Deliberate: no controls surface. This page has no `component`, and every story is a
    // stateful `Demo` wiring a real `CommandList` to its own input and readout. There is no
    // scalar prop a control could move, so the absence is declared rather than left to chance.
    controls: {include: []},
    docs: {
      description: {
        component: [
          'How fast Studio feels is mostly this one component, and the engine itself already ' +
            'holds: arrow keys, Enter, virtualization and jump-by-filter all work. What lets an ' +
            'editor down is what gets fed into the list.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/components/commandList/CommandList.tsx`, Studio-only (no design-system equivalent) |',
          '| Tier | SERVICE, and CORE-adjacent. A horizontal capability rather than a single feature: the virtualized, keyboard-navigable ARIA `combobox` / `listbox` engine that global search, `@`-mentions, the new-document picker and faceted filters all mount |',
          '| Audit | 🔴 needs-work (`command-palette`, `keyboard-only`, `jump-to-item`). The engine itself *holds*. The defect is upstream, in what the surface feeds it |',
          '| Measured | Cmd+K indexes documents only and invokes no commands: publish, duplicate, deploy and theme are unreachable. Keyboard reach never leaves the local list, and long pickers arrive unchunked with no A to Z jump |',
          '| Virtualization | `LargeVirtualizedList` holds 1,200 rows; only the visible window plus overscan is ever in the DOM |',
          '| Harness | the active index lives in an internal ref and no `onActiveIndexChange` callback exists, so the stories surface keyboard state through the row `onClick` the list fires on Enter |',
          '| Patterns | `command-palette` · `keyboard-only` · `jump-to-item` |',
          '',
          'How fast Studio feels is mostly this component. Every quick list an editor touches runs on ' +
            'it: type into global search, `@`-mention a teammate, pick a type out of a thousand-row ' +
            'set, and the same engine is mounting only the rows on screen, moving the active row with ' +
            'the arrow keys, and activating on Enter. Building a searchable or command-driven surface ' +
            'means composing this rather than writing it, because virtualization and ARIA are already ' +
            'settled.',
          '',
          'The stories mount the **real** `CommandList` bare, since it needs only the Sanity UI theme ' +
            'the global decorator already supplies. Each row is a `Card as="button"`, the `a,button` ' +
            'element the list routes keyboard activation through, and `activeItemDataAttr=' +
            '"data-hovered"` makes the Card paint its own active background as focus moves, exactly as ' +
            '`MentionsMenu` and `NewDocumentList` do. The "Last activated" readout on each story is ' +
            'the observable proof that Enter reached the row.',
          '',
          '> **Why it matters:** the engine is not the bottleneck. Arrow keys, Enter, virtualization ' +
            'and jump-by-filter all hold, and the `command-palette` gap is entirely in what the ' +
            'surface *feeds* it. Read `Current` and `Recommended` as one exhibit: the same ' +
            '`CommandList`, one of them handed a mixed command and document index. Fix the input, ' +
            'not the list.',
          '',
          'The page closes *in context*: the ⌘K palette an editor opens to jump to a fixture ' +
            'author (Austen, Tolstoy, Lem, Brontë, Woolf). Type, arrow, Enter.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'chapter:actions',
    'chapter:lists',
    'pattern:command-palette',
    'pattern:keyboard-only',
    'pattern:jump-to-item',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

// --- Stories ---------------------------------------------------------------

/** A short list of documents. The list itself can hold focus (`canReceiveFocus`). */
export const Basic: Story = {
  render: () => {
    function Demo() {
      const [activated, setActivated] = useState('none yet')
      const handleActivate = useCallback((item: Row) => setActivated(item.title), [])
      const render = useCallback(
        (item: Row, context: CommandListItemContext) => renderRow(item, context, handleActivate),
        [handleActivate],
      )
      return (
        <Stack gap={3} style={{maxWidth: 480}}>
          <ListFrame>
            <CommandList
              activeItemDataAttr="data-hovered"
              ariaLabel="Documents"
              canReceiveFocus
              autoFocus="list"
              itemHeight={ITEM_HEIGHT}
              items={DOCUMENTS}
              padding={1}
              renderItem={render}
            />
          </ListFrame>
          <Readout
            label="Last activated (click a row, or focus the list and press Enter)"
            value={activated}
          />
        </Stack>
      )
    }
    return <Demo />
  },
}

/**
 * 1,200 rows. Only the handful of rows inside the viewport (plus overscan) are ever
 * mounted to the DOM. Scroll the list and inspect: the node count stays flat while
 * the scroll height reflects all 1,200. `fixedHeight` skips per-row measurement.
 */
export const LargeVirtualizedList: Story = {
  name: 'Large virtualized list (1,200 items)',
  render: () => {
    function Demo() {
      const [activated, setActivated] = useState('none yet')
      const handleActivate = useCallback((item: Row) => setActivated(item.title), [])
      const render = useCallback(
        (item: Row, context: CommandListItemContext) => renderRow(item, context, handleActivate),
        [handleActivate],
      )
      return (
        <Stack gap={3} style={{maxWidth: 480}}>
          <Text size={1} muted>
            1,200 items. Scroll freely; the DOM only ever holds the visible window.
          </Text>
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
              renderItem={render}
            />
          </ListFrame>
          <Readout label="Last activated" value={activated} />
        </Stack>
      )
    }
    return <Demo />
  },
}

/**
 * The `combobox` pattern: a text input is wired to the list via `inputElement`, so
 * ↑/↓ move the active row, Enter activates it, and `aria-activedescendant` tracks
 * focus on the input. All keyboard, hands never leaving the field.
 */
export const KeyboardNavigation: Story = {
  name: 'Keyboard navigation (combobox)',
  render: () => {
    function Demo() {
      const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null)
      const [query, setQuery] = useState('')
      const [activated, setActivated] = useState('none yet')

      const items = useMemo(
        () => DOCUMENTS.filter((doc) => doc.title.toLowerCase().includes(query.toLowerCase())),
        [query],
      )
      const handleActivate = useCallback((item: Row) => setActivated(item.title), [])
      const render = useCallback(
        (item: Row, context: CommandListItemContext) => renderRow(item, context, handleActivate),
        [handleActivate],
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
          <ListFrame height={320}>
            {items.length > 0 ? (
              <CommandList
                activeItemDataAttr="data-hovered"
                ariaLabel="Filtered documents"
                autoFocus="input"
                inputElement={inputElement}
                itemHeight={ITEM_HEIGHT}
                items={items}
                padding={1}
                renderItem={render}
              />
            ) : (
              <Flex align="center" height="fill" justify="center" padding={4}>
                <Text muted size={1}>
                  No results for “{query}”
                </Text>
              </Flex>
            )}
          </ListFrame>
          <Readout label="Last activated (Enter)" value={activated} />
        </Stack>
      )
    }
    return <Demo />
  },
}

/**
 * Multi-select with `ariaMultiselectable` + `getItemSelected`. Clicking a row toggles
 * its selection; the checkmark and `aria-selected` reflect the current set. Selection
 * state is separate from the active (keyboard-focus) index.
 */
export const ItemsWithSelection: Story = {
  name: 'Items with selection',
  render: () => {
    function Demo() {
      const [selected, setSelected] = useState<ReadonlySet<string>>(new Set(['doc-2', 'doc-5']))

      const toggle = useCallback((item: Row) => {
        setSelected((prev) => {
          const next = new Set(prev)
          if (next.has(item.id)) next.delete(item.id)
          else next.add(item.id)
          return next
        })
      }, [])

      const getItemSelected = useCallback(
        (index: number) => selected.has(DOCUMENTS[index].id),
        [selected],
      )
      const render = useCallback(
        (item: Row, context: CommandListItemContext) =>
          renderRow(item, context, toggle, {showSelection: true}),
        [toggle],
      )

      return (
        <Stack gap={3} style={{maxWidth: 480}}>
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
              renderItem={render}
            />
          </ListFrame>
          <Readout label="Selected ids" value={[...selected].join(', ') || 'none'} />
        </Stack>
      )
    }
    return <Demo />
  },
}

/**
 * `jump-to-item`: a 208-row alphabetical set with a filter input that jumps you to any
 * surname instantly. This is the fix for the audit's "long alpha type-picker, no A to Z jump".
 * Type a letter or name and the list narrows and re-anchors at the top.
 */
export const JumpToItem: Story = {
  name: 'Jump to item',
  render: () => {
    function Demo() {
      const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null)
      const [query, setQuery] = useState('')
      const [activated, setActivated] = useState('none yet')

      const items = useMemo(
        () => ALPHA_LIST.filter((doc) => doc.title.toLowerCase().includes(query.toLowerCase())),
        [query],
      )
      const handleActivate = useCallback((item: Row) => setActivated(item.title), [])
      const render = useCallback(
        (item: Row, context: CommandListItemContext) => renderRow(item, context, handleActivate),
        [handleActivate],
      )

      return (
        <Stack gap={3} style={{maxWidth: 480}}>
          <TextInput
            aria-label="Jump to"
            icon={SearchIcon}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Jump to a surname (e.g. “tol”)"
            ref={setInputElement}
            value={query}
          />
          <ListFrame height={360}>
            <CommandList
              activeItemDataAttr="data-hovered"
              ariaLabel="Authors"
              fixedHeight
              inputElement={inputElement}
              itemHeight={ITEM_HEIGHT}
              items={items}
              overscan={6}
              padding={1}
              renderItem={render}
            />
          </ListFrame>
          <Readout label="Last activated" value={activated} />
        </Stack>
      )
    }
    return <Demo />
  },
}

/**
 * **Current (audit finding).** `command-palette`: the palette indexes **documents only**.
 * Type all you like: you can jump to any document, but there is no way to *do* anything.
 * publish, duplicate, deploy, toggle theme are simply not in the index. Cmd+K is a
 * document jumper wearing a command palette's clothes.
 */
export const Current: Story = {
  name: 'Current (Cmd+K indexes documents only)',
  tags: ['audit:needs-work'],
  render: () => {
    function Demo() {
      const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null)
      const [query, setQuery] = useState('')
      const [activated, setActivated] = useState('none yet')

      const items = useMemo(
        () => DOCUMENTS.filter((doc) => doc.title.toLowerCase().includes(query.toLowerCase())),
        [query],
      )
      const handleActivate = useCallback((item: Row) => setActivated(`Opened: ${item.title}`), [])
      const render = useCallback(
        (item: Row, context: CommandListItemContext) => renderRow(item, context, handleActivate),
        [handleActivate],
      )

      return (
        <Stack gap={3} style={{maxWidth: 480}}>
          <TextInput
            aria-label="Search"
            icon={SearchIcon}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Search documents…  (try “publish”, which finds nothing)"
            ref={setInputElement}
            value={query}
          />
          <ListFrame height={300}>
            {items.length > 0 ? (
              <CommandList
                activeItemDataAttr="data-hovered"
                ariaLabel="Documents"
                autoFocus="input"
                inputElement={inputElement}
                itemHeight={ITEM_HEIGHT}
                items={items}
                padding={1}
                renderItem={render}
              />
            ) : (
              <Flex align="center" height="fill" justify="center" padding={4}>
                <Text muted size={1}>
                  No documents match “{query}”, and no command ever would.
                </Text>
              </Flex>
            )}
          </ListFrame>
          <Readout label="Result" value={activated} />
        </Stack>
      )
    }
    return <Demo />
  },
}

/**
 * **Recommended.** The same `CommandList`, fed a **mixed index**: matching commands
 * surface first (Publish, Duplicate, Deploy, Toggle scheme…), then documents. Selecting
 * a command *does the thing* instead of only navigating. The engine is unchanged; the
 * fix is entirely in what the palette indexes (`command-palette` resolved, `keyboard-only`
 * reach extended to actions).
 */
export const Recommended: Story = {
  name: 'Recommended (commands + documents)',
  tags: ['!audit:needs-work', 'audit:holds'],
  render: () => {
    function Demo() {
      const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null)
      const [query, setQuery] = useState('')
      const [activated, setActivated] = useState('none yet')

      const items = useMemo<Row[]>(() => {
        const q = query.toLowerCase()
        const commands = COMMANDS.filter((cmd) => cmd.title.toLowerCase().includes(q))
        const documents = DOCUMENTS.filter((doc) => doc.title.toLowerCase().includes(q))
        return [...commands, ...documents]
      }, [query])

      const handleActivate = useCallback((item: Row) => {
        setActivated(
          item.kind === 'command' ? `Ran command: ${item.title}` : `Opened: ${item.title}`,
        )
      }, [])
      const render = useCallback(
        (item: Row, context: CommandListItemContext) => renderRow(item, context, handleActivate),
        [handleActivate],
      )

      return (
        <Stack gap={3} style={{maxWidth: 480}}>
          <TextInput
            aria-label="Command palette"
            icon={BoltIcon}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Search commands and documents…  (try “publish”)"
            ref={setInputElement}
            value={query}
          />
          <ListFrame height={340}>
            {items.length > 0 ? (
              <CommandList
                activeItemDataAttr="data-hovered"
                ariaLabel="Commands and documents"
                autoFocus="input"
                inputElement={inputElement}
                itemHeight={ITEM_HEIGHT}
                items={items}
                padding={1}
                renderItem={render}
              />
            ) : (
              <Flex align="center" height="fill" justify="center" padding={4}>
                <Text muted size={1}>
                  No results for “{query}”
                </Text>
              </Flex>
            )}
          </ListFrame>
          <Flex align="center" gap={2}>
            <Text size={0} muted>
              <ArrowRightIcon />
            </Text>
            <Readout label="Result" value={activated} />
          </Flex>
        </Stack>
      )
    }
    return <Demo />
  },
}

/**
 * In context: the command palette the instant an editor hits **⌘K** and starts typing an
 * author's name. This is `Basic`/`JumpToItem` doing their real job: the same virtualized
 * `CommandList` wired to a filter input (the `combobox` pattern), indexing the fixture
 * authors so "tol" jumps straight to Leo Tolstoy. Type, ↑/↓, Enter. This is the palette Studio
 * opens over your content.
 */
export const InContext: Story = {
  name: 'In context (jump to author)',
  parameters: {controls: {include: []}},
  render: () => {
    function Demo() {
      const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null)
      const [query, setQuery] = useState('')
      const [activated, setActivated] = useState('none yet')

      const items = useMemo(() => {
        const authors: DocumentRow[] = [
          {kind: 'document', id: 'author-austen', title: 'Jane Austen', type: 'author'},
          {kind: 'document', id: 'author-tolstoy', title: 'Leo Tolstoy', type: 'author'},
          {kind: 'document', id: 'author-lem', title: 'Stanisław Lem', type: 'author'},
          {kind: 'document', id: 'author-bronte', title: 'Charlotte Brontë', type: 'author'},
          {kind: 'document', id: 'author-woolf', title: 'Virginia Woolf', type: 'author'},
        ]
        const q = query.toLowerCase()
        return authors.filter((doc) => doc.title.toLowerCase().includes(q))
      }, [query])

      const handleActivate = useCallback((item: Row) => setActivated(`Opened: ${item.title}`), [])
      const render = useCallback(
        (item: Row, context: CommandListItemContext) => renderRow(item, context, handleActivate),
        [handleActivate],
      )

      return (
        <Stack gap={3} style={{maxWidth: 480}}>
          <TextInput
            aria-label="Jump to author"
            icon={SearchIcon}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Jump to an author…  (try “tol”)"
            ref={setInputElement}
            value={query}
          />
          <ListFrame height={300}>
            {items.length > 0 ? (
              <CommandList
                activeItemDataAttr="data-hovered"
                ariaLabel="Authors"
                autoFocus="input"
                inputElement={inputElement}
                itemHeight={ITEM_HEIGHT}
                items={items}
                padding={1}
                renderItem={render}
              />
            ) : (
              <Flex align="center" height="fill" justify="center" padding={4}>
                <Text muted size={1}>
                  No authors match “{query}”
                </Text>
              </Flex>
            )}
          </ListFrame>
          <Readout label="Last activated (Enter)" value={activated} />
        </Stack>
      )
    }
    return <Demo />
  },
}
