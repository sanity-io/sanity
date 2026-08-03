import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {DocumentIcon} from '@sanity/icons/Document'
import {Badge, Box, Button as UIButton, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useCallback, useState} from 'react'

// Real component from its real path (org contract §8) — the same engine the anchor
// story mounts. The envisioned work here is entirely in the row template.
import {CommandList} from '../../../../packages/sanity/src/core/components/commandList/CommandList'
import {type CommandListItemContext} from '../../../../packages/sanity/src/core/components/commandList/types'

interface DocRow {
  id: string
  title: string
  type: string
}

const DOCUMENTS: DocRow[] = [
  {id: 'doc-1', title: 'Anna Karenina', type: 'book'},
  {id: 'doc-2', title: 'War and Peace', type: 'book'},
  {id: 'doc-3', title: 'Pride and Prejudice', type: 'book'},
  {id: 'doc-4', title: 'The Idiot', type: 'book'},
  {id: 'doc-5', title: 'Leo Tolstoy', type: 'author'},
  {id: 'doc-6', title: 'Jane Austen', type: 'author'},
  {id: 'doc-7', title: 'Fyodor Dostoevsky', type: 'author'},
  {id: 'doc-8', title: 'Autumn 2026 campaign', type: 'campaign'},
  {id: 'doc-9', title: 'Winter 2026 campaign', type: 'campaign'},
  {id: 'doc-10', title: 'Crime and Punishment', type: 'book'},
  {id: 'doc-11', title: 'Emma', type: 'book'},
  {id: 'doc-12', title: 'Persuasion', type: 'book'},
]

const ITEM_HEIGHT = 45

/**
 * The leading-affordance row: a drawn 16px checkbox well at the reading edge. It is
 * deliberately NOT a native `<input type="checkbox">` — the row itself is the
 * CommandList `button` element, and nesting an input inside a button is invalid HTML;
 * the well is presentation, `aria-selected` on the row is the accessible truth.
 */
function CheckWell({checked}: {checked: boolean}) {
  return (
    <Flex
      align="center"
      justify="center"
      style={{
        width: 16,
        height: 16,
        flexShrink: 0,
        borderRadius: 3,
        border: '1px solid var(--card-border-color)',
        background: checked ? 'var(--card-focus-ring-color)' : 'transparent',
      }}
    >
      {checked && (
        <Text size={0} style={{color: 'var(--card-bg-color)'}}>
          <CheckmarkIcon />
        </Text>
      )}
    </Flex>
  )
}

function renderLeadingRow(
  item: DocRow,
  context: CommandListItemContext,
  onToggle: (item: DocRow) => void,
) {
  return (
    <Card as="button" radius={2} padding={3} onClick={() => onToggle(item)}>
      <Flex align="center" gap={3}>
        <CheckWell checked={Boolean(context.selected)} />
        <Text size={2} muted>
          <DocumentIcon />
        </Text>
        <Box flex={1}>
          <Text size={1} textOverflow="ellipsis">
            {item.title}
          </Text>
        </Box>
        <Badge fontSize={0}>{item.type}</Badge>
      </Flex>
    </Card>
  )
}

function renderTrailingRow(
  item: DocRow,
  context: CommandListItemContext,
  onToggle: (item: DocRow) => void,
) {
  return (
    <Card as="button" radius={2} padding={3} onClick={() => onToggle(item)}>
      <Flex align="center" gap={3}>
        <Text size={2} muted>
          <DocumentIcon />
        </Text>
        <Box flex={1}>
          <Text size={1} textOverflow="ellipsis">
            {item.title}
          </Text>
        </Box>
        <Badge fontSize={0}>{item.type}</Badge>
        {context.selected ? (
          <Text size={1}>
            <CheckmarkIcon />
          </Text>
        ) : (
          // Reserve the glyph column so rows don't shift width on toggle.
          <Box style={{width: 17}} />
        )}
      </Flex>
    </Card>
  )
}

interface SelectableListProps {
  side: 'leading' | 'trailing'
  selected: ReadonlySet<string>
  onToggle: (item: DocRow) => void
  height?: number
}

function SelectableList(props: SelectableListProps) {
  const {side, selected, onToggle, height = 320} = props
  const getItemSelected = useCallback(
    (index: number) => selected.has(DOCUMENTS[index].id),
    [selected],
  )
  const render = useCallback(
    (item: DocRow, context: CommandListItemContext) =>
      side === 'leading'
        ? renderLeadingRow(item, context, onToggle)
        : renderTrailingRow(item, context, onToggle),
    [side, onToggle],
  )
  return (
    <Card border radius={2} overflow="hidden" style={{height}}>
      <CommandList
        activeItemDataAttr="data-hovered"
        ariaLabel={
          side === 'leading' ? 'Documents (leading selection)' : 'Documents (trailing selection)'
        }
        ariaMultiselectable
        canReceiveFocus
        getItemSelected={getItemSelected}
        itemHeight={ITEM_HEIGHT}
        items={DOCUMENTS}
        padding={1}
        renderItem={render}
      />
    </Card>
  )
}

function useSelection(initial: string[] = []) {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set(initial))
  const toggle = useCallback((item: DocRow) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(item.id)) next.delete(item.id)
      else next.add(item.id)
      return next
    })
  }, [])
  return {selected, toggle}
}

const meta: Meta = {
  title: 'Envisioned/Selection Side',
  parameters: {
    docs: {
      description: {
        component: [
          'Studio has no selection model at all yet, so when it grows one it gets to choose where ' +
            'the affordance lives, and the two candidate templates are not interchangeable: ' +
            'management lists take a leading checkbox well; pickers take a trailing checkmark.',
          '',
          '| | |',
          '|---|---|',
          '| Anchor | `Actions & Commands/CommandList`, the Items with selection story, which proves the engine already supports `ariaMultiselectable` and `getItemSelected` and marks selection with a trailing checkmark |',
          '| Evidence | audit `bulk-actions` (ch8: primary lists have no multi-select/checkboxes/bulk ops) and `jakobs-law`; researcher’s brief §7, the selection model is the floor of the trust ladder, competitively confirmed by both leaders’ real selection models |',
          '| Patterns | `bulk-actions` · `jakobs-law` |',
          '',
          'A leading well is visible at rest, it announces that multi-select exists before any ' +
            'interaction, the discoverability `bulk-actions` dies without, it sits at the reading ' +
            'edge so selected rows form one scannable column, and it is where every neighbouring ' +
            "product puts it (Jakob's law: WordPress, Payload, Contentful all lead). A trailing " +
            'checkmark is right where selection is transient and singular, palettes and pickers, ' +
            'because it keeps the reading edge clean and the affordance only matters on the ' +
            'active row.',
          '',
          'Both variants run on the real `CommandList` with real multi-select state; the row ' +
            'template is the only thing that changes. Two proof devices: the glance test story ' +
            'masks each list after one second and asks how many rows were selected, and the ' +
            'at-rest story strips all hover state so each template answers the discoverability ' +
            'question cold: does this list even do multi-select?',
          '',
          '> **Why it matters:** the aligned leading column survives a one-second glance; the ' +
            'trailing glyphs mostly do not. Run the glance test on yourself before trusting the ' +
            'argument, the meters below are measured live, not asserted.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'variant:envisioned',
    'chapter:actions',
    'chapter:lists',
    'pattern:bulk-actions',
    'pattern:jakobs-law',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/**
 * The pair, live: identical data, identical engine, the affordance on opposite sides.
 * Select a few rows in each, notice where your eye goes to confirm what is selected.
 * The leading well forms a single vertical column at the reading edge; the trailing
 * checkmark asks you to sweep past title and type badge on every row.
 */
export const TradeoffPair: Story = {
  name: 'The tradeoff pair (leading vs trailing)',
  render: () => {
    function Demo() {
      const leading = useSelection(['doc-2', 'doc-5'])
      const trailing = useSelection(['doc-2', 'doc-5'])
      return (
        <Flex gap={4} align="flex-start" wrap="wrap">
          <Stack gap={3} style={{width: 380}}>
            <Text size={1} weight="medium">
              Leading well, for management lists
            </Text>
            <SelectableList side="leading" selected={leading.selected} onToggle={leading.toggle} />
            <Text size={0} muted>
              {leading.selected.size} selected, visible as one aligned column
            </Text>
          </Stack>
          <Stack gap={3} style={{width: 380}}>
            <Text size={1} weight="medium">
              Trailing checkmark, for pickers
            </Text>
            <SelectableList
              side="trailing"
              selected={trailing.selected}
              onToggle={trailing.toggle}
            />
            <Text size={0} muted>
              {trailing.selected.size} selected, read row-by-row at the far edge
            </Text>
          </Stack>
        </Flex>
      )
    }
    return <Demo />
  },
}

const FLASH_SELECTION = ['doc-2', 'doc-4', 'doc-6', 'doc-9', 'doc-11']
const FLASH_SET: ReadonlySet<string> = new Set(FLASH_SELECTION)
const EMPTY_SET: ReadonlySet<string> = new Set()
const noToggle = () => undefined

/**
 * Proof device, the glance test. Press Flash: both lists show the same 5-row
 * selection for one second, then mask. Answer before revealing: how many rows were
 * selected in each? The leading column reads as a single countable stripe; the
 * trailing glyphs have to be found row-by-row, and a one-second glance is rarely
 * enough. This is the scan-column argument made falsifiable, run it on yourself.
 */
export const GlanceTest: Story = {
  name: 'Proof: the glance test',
  render: () => {
    function Demo() {
      const [phase, setPhase] = useState<'idle' | 'flashing' | 'masked' | 'revealed'>('idle')

      const flash = useCallback(() => {
        setPhase('flashing')
        setTimeout(() => setPhase('masked'), 1000)
      }, [])

      const visible = phase === 'flashing' || phase === 'revealed'

      return (
        <Stack gap={4}>
          <Flex gap={2} align="center">
            <UIButton
              text={phase === 'idle' ? 'Flash for 1 second' : 'Flash again'}
              tone="primary"
              disabled={phase === 'flashing'}
              onClick={flash}
            />
            {phase === 'masked' && (
              <UIButton text="Reveal answer" mode="ghost" onClick={() => setPhase('revealed')} />
            )}
            {phase === 'revealed' && (
              <Text size={1} muted>
                Both lists had {FLASH_SET.size} selected rows.
              </Text>
            )}
          </Flex>
          <Flex gap={4} align="flex-start" wrap="wrap">
            {(['leading', 'trailing'] as const).map((side) => (
              <Stack key={side} gap={2} style={{width: 380}}>
                <Text size={1} weight="medium">
                  {side === 'leading' ? 'Leading well' : 'Trailing checkmark'}
                </Text>
                <div style={{position: 'relative'}}>
                  <div style={{visibility: visible ? 'visible' : 'hidden', pointerEvents: 'none'}}>
                    <SelectableList
                      side={side}
                      selected={FLASH_SET}
                      onToggle={noToggle}
                      height={280}
                    />
                  </div>
                  {!visible && (
                    <Card
                      border
                      radius={2}
                      tone="transparent"
                      style={{position: 'absolute', inset: 0}}
                    >
                      <Flex align="center" justify="center" height="fill">
                        <Text size={1} muted>
                          {phase === 'idle' ? 'Press Flash' : 'How many were selected?'}
                        </Text>
                      </Flex>
                    </Card>
                  )}
                </div>
              </Stack>
            ))}
          </Flex>
        </Stack>
      )
    }
    return <Demo />
  },
}

/**
 * Proof device, at rest. No selection, no hover, pointer disabled: this is the
 * list as an editor first meets it. The leading template announces multi-select
 * (twelve empty wells are an unmistakable promise); the trailing template is
 * indistinguishable from a single-select list, the capability is invisible until
 * stumbled upon, which is precisely how the audit's `bulk-actions` gap stayed
 * unnoticed inside surfaces that technically supported selection.
 */
export const AtRest: Story = {
  name: 'Proof: at-rest discoverability',
  render: () => (
    <Flex gap={4} align="flex-start" wrap="wrap">
      {(['leading', 'trailing'] as const).map((side) => (
        <Stack key={side} gap={2} style={{width: 380}}>
          <Text size={1} weight="medium">
            {side === 'leading' ? 'Leading, promises multi-select' : 'Trailing, promises nothing'}
          </Text>
          <div style={{pointerEvents: 'none'}}>
            <SelectableList side={side} selected={EMPTY_SET} onToggle={noToggle} height={240} />
          </div>
        </Stack>
      ))}
    </Flex>
  ),
}
