import {RestoreIcon} from '@sanity/icons/Restore'
import {UndoIcon} from '@sanity/icons/Undo'
import {Badge, Box, Button as UIButton, Card, Code, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useCallback, useState} from 'react'

interface DocState {
  title: string
  subtitle: string
}

interface HistoryEntry {
  id: number
  label: string
  /** The full document state AFTER this step — jumping restores it wholesale. */
  state: DocState
  at: string
}

const INITIAL: DocState = {title: 'Dune', subtitle: 'A desert planet'}

function timestamp(): string {
  return new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'})
}

const meta: Meta = {
  title: 'Envisioned/Undo Timeline',
  parameters: {
    docs: {
      description: {
        component: [
          'Ctrl+Z is a fine verb and a terrible map: it answers step back once but never how far ' +
            'back can I go, what would three steps back land on, or which of these steps was the ' +
            'one that broke it. Studio is the one product where the depth already exists, every ' +
            'keystroke is history, which makes the missing affordance pure surface debt.',
          '',
          '| | |',
          '|---|---|',
          '| Anchor | `Forms & Input/StringInput` (the committed-field editing loop these steps come from) and `Document Status/Document Status`, the document-level surface a history control belongs beside. Undo in Studio exists but is keyboard-only, with no UI control |',
          '| Evidence | audit `multilevel-undo` (ch8: undo is keyboard-only, no UI control); researcher’s brief §3, undo depth is one of the sixteen convergent failures; §6’s parity trap warns the other direction, wire the depth first, then the affordance |',
          '| Patterns | `multilevel-undo` · `safe-exploration` |',
          '',
          'The envisioned control is an undo timeline: the history stack as a visible, labelled, ' +
            'clickable list, each entry names its change in editorial terms, and clicking any ' +
            'depth restores the document to that point in one act. Steps above the jump target ' +
            'stay in the list, greyed, a redo lane, not a destroyed future, so exploration of ' +
            'history is itself safe.',
          '',
          '> **Why it matters:** the strip above the form counts the reachable past. Make a few ' +
            'edits, then click three steps back, then click forward again. The counter and the ' +
            'greyed redo lane are the falsifiable difference between this and a blind Ctrl+Z, ' +
            'depth you can see before spending it. Today’s Studio ships the same depth with a ' +
            'readout of zero.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'variant:envisioned',
    'chapter:actions',
    'chapter:people',
    'pattern:multilevel-undo',
    'pattern:safe-exploration',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/**
 * Edit either field (commit with Enter or by clicking away), grow some history, then
 * travel: click any entry to land on it. Entries ahead of you grey into the redo
 * lane and stay clickable. The depth meter is the argument: visible, labelled,
 * spendable history versus a keyboard verb you must fire blind.
 */
export const Timeline: Story = {
  name: 'The undo timeline (history with a UI)',
  render: () => {
    function Demo() {
      const [doc, setDoc] = useState<DocState>(INITIAL)
      const [draft, setDraft] = useState<DocState>(INITIAL)
      const [history, setHistory] = useState<HistoryEntry[]>([
        {id: 0, label: 'Document created', state: INITIAL, at: timestamp()},
      ])
      const [cursor, setCursor] = useState(0)

      const commit = useCallback(
        (field: keyof DocState) => {
          const prev = doc[field]
          const next = draft[field]
          if (prev === next) return
          const nextState = {...doc, [field]: next}
          setDoc(nextState)
          setHistory((entries) => {
            // Committing from mid-history branches: drop the redo lane, as editors expect.
            const kept = entries.slice(0, cursor + 1)
            return [
              ...kept,
              {
                id: entries.length,
                label: `${field}: “${prev}” → “${next}”`,
                state: nextState,
                at: timestamp(),
              },
            ]
          })
          setCursor((index) => index + 1)
        },
        [doc, draft, cursor],
      )

      const jump = useCallback(
        (index: number) => {
          setCursor(index)
          setDoc(history[index].state)
          setDraft(history[index].state)
        },
        [history],
      )

      const depth = cursor
      const redoLane = history.length - 1 - cursor

      return (
        <Flex gap={4} align="flex-start" wrap="wrap">
          {/* The document form. */}
          <Stack gap={3} style={{width: 340}}>
            <Card border padding={3} radius={2} tone="transparent">
              <Flex align="center" gap={3}>
                <Text size={1}>
                  <UndoIcon />
                </Text>
                <Text size={1} weight="medium">
                  {depth} {depth === 1 ? 'step' : 'steps'} of visible past
                </Text>
                {redoLane > 0 && <Badge fontSize={0}>+{redoLane} redo</Badge>}
              </Flex>
            </Card>
            <Card border padding={3} radius={2}>
              <Stack gap={3}>
                <Stack gap={2}>
                  <Text size={1} weight="medium">
                    Title
                  </Text>
                  <TextInput
                    aria-label="Title"
                    value={draft.title}
                    onChange={(event) => setDraft({...draft, title: event.currentTarget.value})}
                    onBlur={() => commit('title')}
                    onKeyDown={(event) => event.key === 'Enter' && commit('title')}
                  />
                </Stack>
                <Stack gap={2}>
                  <Text size={1} weight="medium">
                    Subtitle
                  </Text>
                  <TextInput
                    aria-label="Subtitle"
                    value={draft.subtitle}
                    onChange={(event) => setDraft({...draft, subtitle: event.currentTarget.value})}
                    onBlur={() => commit('subtitle')}
                    onKeyDown={(event) => event.key === 'Enter' && commit('subtitle')}
                  />
                </Stack>
              </Stack>
            </Card>
            <Card border padding={3} radius={2} tone="transparent">
              <Stack gap={2}>
                <Text size={0} muted weight="medium">
                  Document value
                </Text>
                <Code size={0}>{JSON.stringify(doc, null, 2)}</Code>
              </Stack>
            </Card>
          </Stack>

          {/* The timeline: newest first, current position marked, redo lane greyed. */}
          <Stack gap={2} style={{width: 380}}>
            <Text size={1} weight="medium">
              History, click any depth
            </Text>
            <Card border radius={2} padding={2}>
              <Stack gap={1}>
                {[...history].reverse().map((entry) => {
                  const index = history.indexOf(entry)
                  const isCurrent = index === cursor
                  const isRedo = index > cursor
                  return (
                    <Card
                      key={entry.id}
                      as="button"
                      radius={2}
                      padding={3}
                      tone={isCurrent ? 'primary' : 'default'}
                      onClick={() => jump(index)}
                      style={isRedo ? {opacity: 0.45} : undefined}
                    >
                      <Flex align="center" gap={3}>
                        <Text size={1} muted>
                          <RestoreIcon />
                        </Text>
                        <Box flex={1}>
                          <Text size={1} textOverflow="ellipsis">
                            {entry.label}
                          </Text>
                        </Box>
                        {isCurrent ? (
                          <Badge fontSize={0} tone="primary">
                            you are here
                          </Badge>
                        ) : (
                          <Text size={0} muted>
                            {entry.at}
                          </Text>
                        )}
                        {isRedo && <Badge fontSize={0}>redo</Badge>}
                      </Flex>
                    </Card>
                  )
                })}
              </Stack>
            </Card>
            <Flex>
              <UIButton
                icon={UndoIcon}
                text="Undo one step"
                mode="ghost"
                disabled={cursor === 0}
                onClick={() => jump(cursor - 1)}
              />
            </Flex>
            <Text size={0} muted>
              The same stack Ctrl+Z walks blind, labelled, counted, and clickable. New edits made
              mid-history branch forward and retire the redo lane.
            </Text>
          </Stack>
        </Flex>
      )
    }
    return <Demo />
  },
}
