import {BoltIcon} from '@sanity/icons/Bolt'
import {ClockIcon} from '@sanity/icons/Clock'
import {CopyIcon} from '@sanity/icons/Copy'
import {DocumentIcon} from '@sanity/icons/Document'
import {MoonIcon} from '@sanity/icons/Moon'
import {PublishIcon} from '@sanity/icons/Publish'
import {RocketIcon} from '@sanity/icons/Rocket'
import {TrashIcon} from '@sanity/icons/Trash'
import {UnpublishIcon} from '@sanity/icons/Unpublish'
import {Badge, Box, Card, Code, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ComponentType, useCallback, useMemo, useRef, useState} from 'react'

// Real components from real paths (org contract §8): the listbox engine every Studio
// palette mounts, and the keycap renderer a real shortcut legend would use.
import {CommandList} from '../../../../packages/sanity/src/core/components/commandList/CommandList'
import {type CommandListItemContext} from '../../../../packages/sanity/src/core/components/commandList/types'
import {Hotkeys} from '../../../../packages/sanity/src/core/components/Hotkeys'

interface CommandRow {
  kind: 'command'
  id: string
  title: string
  icon: ComponentType
  keys?: string[]
  recent?: boolean
}

interface DocumentRow {
  kind: 'document'
  id: string
  title: string
  type: string
  recent?: boolean
}

type Row = CommandRow | DocumentRow

const COMMANDS: CommandRow[] = [
  {
    kind: 'command',
    id: 'cmd-publish',
    title: 'Publish document',
    icon: PublishIcon,
    keys: ['Ctrl', 'Alt', 'P'],
    recent: true,
  },
  {
    kind: 'command',
    id: 'cmd-duplicate',
    title: 'Duplicate document',
    icon: CopyIcon,
    keys: ['Ctrl', 'Alt', 'D'],
  },
  {kind: 'command', id: 'cmd-unpublish', title: 'Unpublish document', icon: UnpublishIcon},
  {kind: 'command', id: 'cmd-deploy', title: 'Deploy Studio', icon: RocketIcon},
  {kind: 'command', id: 'cmd-theme', title: 'Toggle color scheme', icon: MoonIcon},
  {kind: 'command', id: 'cmd-delete', title: 'Delete document', icon: TrashIcon},
]

const DOCUMENTS: DocumentRow[] = [
  {kind: 'document', id: 'doc-1', title: 'Anna Karenina', type: 'book', recent: true},
  {kind: 'document', id: 'doc-2', title: 'War and Peace', type: 'book'},
  {kind: 'document', id: 'doc-3', title: 'Pride and Prejudice', type: 'book'},
  {kind: 'document', id: 'doc-4', title: 'The Idiot', type: 'book'},
  {kind: 'document', id: 'doc-5', title: 'Leo Tolstoy', type: 'author', recent: true},
  {kind: 'document', id: 'doc-6', title: 'Jane Austen', type: 'author'},
  {kind: 'document', id: 'doc-7', title: 'Fyodor Dostoevsky', type: 'author'},
  {kind: 'document', id: 'doc-8', title: 'Autumn 2026 campaign', type: 'campaign'},
]

const ITEM_HEIGHT = 45

/**
 * Relevance for the interleaved index: prefix match beats word-boundary match beats
 * substring; a tie goes to commands (a matching verb is almost always the intent).
 * Empty query = the recents shelf.
 */
function score(title: string, query: string): number {
  const t = title.toLowerCase()
  if (t.startsWith(query)) return 3
  if (t.split(/\s+/).some((word) => word.startsWith(query))) return 2
  if (t.includes(query)) return 1
  return 0
}

function rank(query: string): Row[] {
  const q = query.trim().toLowerCase()
  if (!q) {
    return [...COMMANDS.filter((c) => c.recent), ...DOCUMENTS.filter((d) => d.recent)]
  }
  const all: Row[] = [...COMMANDS, ...DOCUMENTS]
  return all
    .map((row) => ({row, s: score(row.title, q)}))
    .filter((entry) => entry.s > 0)
    .sort(
      (a, b) =>
        b.s - a.s || (a.row.kind === 'command' ? -1 : 1) - (b.row.kind === 'command' ? -1 : 1),
    )
    .map((entry) => entry.row)
}

const meta: Meta = {
  title: 'Envisioned/Command Palette Console',
  parameters: {
    docs: {
      description: {
        component: [
          'Three design moves distinguish a console from a search box, and all three run live ' +
            'here on the real `CommandList`: an empty query surfaces commands and documents ' +
            'interleaved by relevance, and every command teaches its own shortcut.',
          '',
          '| | |',
          '|---|---|',
          '| Anchor | `Actions & Commands/CommandList`, the Current / Recommended pair. Current proves Cmd+K indexes documents only; Recommended proves the engine happily renders a mixed index. This story is the step past Recommended: what Cmd+K becomes when it is designed as a console, not a patched search box |',
          '| Evidence | audit `command-palette` (Cmd+K indexes documents only, invokes no commands, publish/duplicate/deploy/theme not reachable), `keyboard-only`, `satisficing` (no most-likely-first anywhere); ledger #15 (the command-palette defect is an indexing decision, not an engine limit); ledger #8 (no `onActiveIndexChange`, why the readout observes Enter, not hover) |',
          '| Patterns | `command-palette` · `keyboard-only` · `satisficing` |',
          '',
          'An empty query is the recents shelf, the most-likely-first answer `satisficing` asks ' +
            'for. Commands and documents interleave by relevance rather than living in separate ' +
            'silos, a matching verb outranks a matching noun because typing "pub" means do, not ' +
            'find. Every command teaches its own shortcut, the keycaps are the real `Hotkeys` ' +
            'component, so the palette doubles as the discoverable keyboard map the audit found ' +
            'missing.',
          '',
          '> **Why it matters:** the console counts every key pressed from focus to execution. ' +
            '"Publish document" is reachable in four keystrokes and zero for a recent; in today’s ' +
            'Studio it is reachable in no number of keystrokes, because it is not in the index at ' +
            'all. That asymmetry, a finite number versus undefined, is the argument.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'variant:envisioned',
    'chapter:actions',
    'pattern:command-palette',
    'pattern:keyboard-only',
    'pattern:satisficing',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

function renderConsoleRow(
  item: Row,
  _context: CommandListItemContext,
  onActivate: (item: Row) => void,
) {
  const Icon = item.kind === 'command' ? item.icon : DocumentIcon
  return (
    <Card as="button" radius={2} padding={3} onClick={() => onActivate(item)}>
      <Flex align="center" gap={3}>
        <Text size={2} muted={item.kind === 'document'}>
          <Icon />
        </Text>
        <Box flex={1}>
          <Text size={1} textOverflow="ellipsis">
            {item.title}
          </Text>
        </Box>
        {item.recent && (
          <Text size={0} muted>
            <ClockIcon />
          </Text>
        )}
        {item.kind === 'document' ? (
          <Badge fontSize={0}>{item.type}</Badge>
        ) : item.keys ? (
          <Hotkeys keys={item.keys} makePlatformAware={false} />
        ) : (
          <Badge fontSize={0} tone="primary">
            command
          </Badge>
        )}
      </Flex>
    </Card>
  )
}

/**
 * The console. Focus starts in the field; the meter starts at zero. Try three runs:
 * press down-arrow Enter on the empty recents shelf (2 keystrokes to your last action), type
 * "pub" Enter (4 keystrokes to Publish), and type "tol" Enter (4 to a document).
 * Commands execute, documents open: one index, one grammar, hands on the keyboard.
 */
export const Console: Story = {
  name: 'The console (recents, interleaving, taught shortcuts)',
  render: () => {
    function Demo() {
      const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null)
      const [query, setQuery] = useState('')
      const [keystrokes, setKeystrokes] = useState(0)
      const [result, setResult] = useState<{text: string; keys: number} | null>(null)
      // The state above renders the meter; the ref is the exact count at the moment of
      // activation (the capture handler has already counted the activating Enter, so
      // reading state here would double-count it).
      const keyCount = useRef(0)

      const items = useMemo(() => rank(query), [query])

      const countKey = useCallback(() => {
        keyCount.current += 1
        setKeystrokes(keyCount.current)
      }, [])

      const handleActivate = useCallback((item: Row) => {
        setResult({
          text: item.kind === 'command' ? `Ran: ${item.title}` : `Opened: ${item.title}`,
          keys: keyCount.current,
        })
        keyCount.current = 0
        setKeystrokes(0)
        setQuery('')
      }, [])
      const render = useCallback(
        (item: Row, context: CommandListItemContext) =>
          renderConsoleRow(item, context, handleActivate),
        [handleActivate],
      )

      return (
        <Stack gap={3} style={{maxWidth: 520}} onKeyDownCapture={countKey}>
          <TextInput
            aria-label="Command console"
            icon={BoltIcon}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Type a verb or a title, or just down-arrow Enter for your last action"
            ref={setInputElement}
            value={query}
          />
          <Card border radius={2} overflow="hidden" style={{height: 340}}>
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
                  No commands or documents match “{query}”
                </Text>
              </Flex>
            )}
          </Card>
          <Flex gap={3} align="stretch">
            <Card border padding={3} radius={2} tone="transparent" flex={1}>
              <Stack gap={2}>
                <Text size={0} muted weight="medium">
                  Keystroke meter (since last run)
                </Text>
                <Code size={1}>{String(keystrokes)}</Code>
              </Stack>
            </Card>
            <Card border padding={3} radius={2} tone="transparent" flex={2}>
              <Stack gap={2}>
                <Text size={0} muted weight="medium">
                  Last execution
                </Text>
                <Code size={1}>
                  {result ? `${result.text}, in ${result.keys} keystrokes` : 'n/a'}
                </Code>
              </Stack>
            </Card>
          </Flex>
          <Text size={0} muted>
            The same run in today’s Studio: documents cost about the same, commands are unreachable
            at any keystroke count.
          </Text>
        </Stack>
      )
    }
    return <Demo />
  },
}
