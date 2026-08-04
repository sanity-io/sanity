import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {DocumentIcon} from '@sanity/icons/Document'
import {ExpandIcon} from '@sanity/icons/Expand'
import {PublishIcon} from '@sanity/icons/Publish'
import {TrashIcon} from '@sanity/icons/Trash'
import {Badge, Box, Button as UIButton, Card, Code, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type MouseEvent, useCallback, useMemo, useRef, useState} from 'react'

// Real component from its real path (org contract §8): the multi-select capable
// listbox engine — `ariaMultiselectable` + `getItemSelected` are shipped props.
import {CommandList} from '../../../../packages/sanity/src/core/components/commandList/CommandList'
import {type CommandListItemContext} from '../../../../packages/sanity/src/core/components/commandList/types'

interface DocRow {
  id: string
  title: string
  type: string
  status: 'draft' | 'published'
}

const DOCUMENTS: DocRow[] = [
  {id: 'doc-1', title: 'Anna Karenina', type: 'book', status: 'draft'},
  {id: 'doc-2', title: 'War and Peace', type: 'book', status: 'draft'},
  {id: 'doc-3', title: 'Pride and Prejudice', type: 'book', status: 'published'},
  {id: 'doc-4', title: 'The Idiot', type: 'book', status: 'draft'},
  {id: 'doc-5', title: 'Emma', type: 'book', status: 'draft'},
  {id: 'doc-6', title: 'Persuasion', type: 'book', status: 'draft'},
  {id: 'doc-7', title: 'Dune', type: 'book', status: 'published'},
  {id: 'doc-8', title: 'Dune Messiah', type: 'book', status: 'draft'},
  {id: 'doc-9', title: 'The Dispossessed', type: 'book', status: 'draft'},
  {id: 'doc-10', title: 'Crime and Punishment', type: 'book', status: 'draft'},
]

const ITEM_HEIGHT = 45

/** What publishing costs without a selection model: open, act, confirm, go back — per document. */
const INTERACTIONS_PER_DOC_TODAY = 3

const meta: Meta = {
  title: 'Envisioned/Bulk Selection',
  parameters: {
    docs: {
      description: {
        component: [
          'A selection model is a tiny grammar, and all its rules matter: click toggles one, ' +
            'shift-click extends a range from the last toggle, and the header well selects and ' +
            'clears all. An editor who cannot select three documents and delete them will not ' +
            'believe a provenance ledger.',
          '',
          '|          |                                                                                                                                                                                                                                                                                                                                                                                                            |',
          '| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |',
          '| Anchor   | `Actions & Commands/CommandList`, Items with selection, which proves the engine’s `ariaMultiselectable` + `getItemSelected` machinery works today. This story is that machinery given the three things a selection model needs beyond toggling: range gestures, a select-all, and an action bar that spends the selection                                                                                  |',
          '| Evidence | audit `bulk-actions` (ch8: primary lists have no multi-select/checkboxes/bulk ops, one of only five ch8 negatives); researcher’s brief §7, the named keystone of the floor: the sequencing logic is not fix small things first, it is credibility. The brief also notes the selection model was already the overhaul’s P1 keystone, now competitively confirmed by both competitors’ real selection models |',
          '| Patterns | `bulk-actions` · `jakobs-law`                                                                                                                                                                                                                                                                                                                                                                              |',
          '',
          'Click toggles one; shift-click extends a range from the last toggle (the gesture ' +
            'every neighbouring product has taught editors to expect, Jakob’s law working for ' +
            'us); "Extend to next click" in the header arms the same range extension without a ' +
            'modifier key; the header well selects and clears all. The modifier-free path is not ' +
            'a fallback, shift-click is a mouse-with-keyboard gesture, and a real selection model ' +
            'must offer range selection to touch editors and assistive input too. The selection ' +
            'then becomes a first-class object with its own surface, the action bar, which states ' +
            'the count, offers the verbs, and is the natural home for the consequence-preview ' +
            'patterns the other Envisioned stories argue for (a bulk delete would speak ' +
            'Reference-Ledger; a bulk publish would speak Validation-Timing).',
          '',
          'Verification note, 2026-07-24: the shift-click path reads `event.shiftKey` straight ' +
            "off the row's React click event, the standard seam real browser shift-clicks " +
            'populate. Automation caveat, twice reproduced (build verification and QA morning ' +
            'sweep): modifier clicks issued through the claude-in-chrome extension arrive at the ' +
            'page with `shiftKey: false`, so extension-driven QA sees toggling instead of ranges; ' +
            'the same handler receives correct ranges when the click event actually carries ' +
            '`shiftKey: true` (verified with dispatched events). Use the armed "Extend to next ' +
            'click" path to demonstrate range selection from any input source. Related engine ' +
            'note: `CommandList` keyboard activation synthesizes an unmodified `.click()`, so ' +
            'modifier-dependent gestures are unreachable from the keyboard through the engine, ' +
            'one more reason the grammar needs the modifier-free rule (see ledger #8).',
          '',
          '> **Why it matters:** every selection gesture is counted. Select all ten drafts and ' +
            'press Publish, and the meter shows what the batch cost versus the same outcome ' +
            "one-at-a-time in today's Studio. The ratio grows linearly with the document count, " +
            'which is exactly why the audit calls this a floor pattern: its absence taxes every ' +
            'list, every day.',
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
 * The grammar, live: click to toggle, shift-click (or the armed "Extend to next
 * click") to extend a range, the header well for all/none. The action bar appears
 * the moment a selection exists and spends it in one act; the meter under the list
 * keeps the running comparison with today's one-document-at-a-time cost.
 *
 * **Range-extend fix (2026-07-30).** A verification agent reproduced the extend gesture
 * selecting only its two endpoints, never the span between - two range lengths tried (expected 6,
 * then expected 4), both came back as 2 selected - confirmed by both shift-click and the armed
 * "Extend to next click" path, so it was the shared range-fill in `toggle`, not either trigger.
 *
 * Mechanism, traced rather than assumed: `anchor.current = index` (last line of `toggle`) runs
 * synchronously at the end of the handler, but the `setSelected` updater that reads
 * `anchor.current` does not run inline where `setSelected(...)` is called - React defers it past
 * the end of the handler. So by the time the updater actually executed, the ref had ALREADY been
 * overwritten with the CURRENT click's own index, and `Math.min(anchor.current, index)` /
 * `Math.max(...)` collapsed to `Math.min(index, index)..Math.max(index, index)` - a range of one,
 * always the row just clicked. Fixed by capturing `anchorIndex = anchor.current` into a plain
 * local before the ref is touched again; a `const` is closed over by value, so the updater sees
 * the anchor as it stood when the click happened, not as it stands when the updater finally runs.
 *
 * Verification method: this story has no play function and cannot be exercised by an automated
 * click sequence without one, and this pass does not add one (single bounded fix, out of scope
 * per the brief). Verified by static trace of the corrected code plus the failure mechanism above,
 * not by rebuilding. Falsifiable prediction for the next person to check against a running build:
 * clicking row index 1 (no modifier) then shift-clicking row index 6 should select exactly 6 rows
 * (indices 1-6 inclusive); clearing and clicking row index 3 then shift-clicking row index 6
 * should select exactly 4 rows (indices 3-6). If either count comes back as 2 (just the
 * endpoints), the fix did not hold and the anchor is still being read live somewhere in the path.
 */
export const SelectionModel: Story = {
  name: 'The selection model (click · range · select all)',
  render: () => {
    function Demo() {
      const [docs, setDocs] = useState<DocRow[]>(DOCUMENTS)
      const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
      const [interactions, setInteractions] = useState(0)
      const [lastResult, setLastResult] = useState<string | null>(null)
      // Modifier-free range arming — the touch/assistive/automation path to the same
      // extension shift-click performs. One-shot: it disarms after the extending click.
      const [rangeArmed, setRangeArmed] = useState(false)
      const anchor = useRef<number | null>(null)

      const toggle = useCallback(
        (item: DocRow, shiftKey: boolean) => {
          setInteractions((n) => n + 1)
          const index = docs.findIndex((doc) => doc.id === item.id)
          // Capture the anchor's value now, not just the "is there one" check: `setSelected`'s
          // updater below does not run inline (React defers it past the end of this handler),
          // so by the time it ran, `anchor.current = index` on the last line here had ALREADY
          // overwritten the ref with THIS click's own index. The updater was reading the anchor
          // AFTER it had been clobbered to equal `index`, collapsing every range to
          // `Math.min(index, index)..Math.max(index, index)`, a single row, always the row just
          // clicked. That is why only the two endpoints of an intended range ever ended up
          // selected: the first click sets one endpoint directly, and the "extending" click adds
          // only itself rather than the span. Closing over a plain local (captured by value, not
          // read live off the ref) fixes it.
          const anchorIndex = anchor.current
          const extend = (shiftKey || rangeArmed) && anchorIndex !== null
          setSelected((prev) => {
            const next = new Set(prev)
            if (extend) {
              const [from, to] = [Math.min(anchorIndex!, index), Math.max(anchorIndex!, index)]
              for (let i = from; i <= to; i++) next.add(docs[i].id)
            } else if (next.has(item.id)) {
              next.delete(item.id)
            } else {
              next.add(item.id)
            }
            return next
          })
          if (extend) setRangeArmed(false)
          anchor.current = index
        },
        [docs, rangeArmed],
      )

      const allSelected = selected.size === docs.length && docs.length > 0

      const toggleAll = useCallback(() => {
        setInteractions((n) => n + 1)
        setSelected(allSelected ? new Set() : new Set(docs.map((doc) => doc.id)))
        anchor.current = null
      }, [allSelected, docs])

      const getItemSelected = useCallback(
        (index: number) => selected.has(docs[index].id),
        [selected, docs],
      )

      const render = useCallback(
        (item: DocRow, context: CommandListItemContext) => (
          <Card
            as="button"
            radius={2}
            padding={3}
            onClick={(event: MouseEvent) => toggle(item, event.shiftKey)}
          >
            <Flex align="center" gap={3}>
              <Flex
                align="center"
                justify="center"
                style={{
                  width: 16,
                  height: 16,
                  flexShrink: 0,
                  borderRadius: 3,
                  border: '1px solid var(--card-border-color)',
                  background: context.selected ? 'var(--card-focus-ring-color)' : 'transparent',
                }}
              >
                {context.selected && (
                  <Text size={0} style={{color: 'var(--card-bg-color)'}}>
                    <CheckmarkIcon />
                  </Text>
                )}
              </Flex>
              <Text size={2} muted>
                <DocumentIcon />
              </Text>
              <Box flex={1}>
                <Text size={1} textOverflow="ellipsis">
                  {item.title}
                </Text>
              </Box>
              <Badge
                fontSize={0}

                tone={item.status === 'published' ? 'positive' : 'caution'}
              >
                {item.status}
              </Badge>
            </Flex>
          </Card>
        ),
        [toggle],
      )

      const selectedDrafts = useMemo(
        () => docs.filter((doc) => selected.has(doc.id) && doc.status === 'draft'),
        [docs, selected],
      )

      const handlePublish = () => {
        setInteractions((n) => n + 1)
        const count = selectedDrafts.length
        setDocs((prev) =>
          prev.map((doc) => (selected.has(doc.id) ? {...doc, status: 'published' as const} : doc)),
        )
        const today = selected.size * INTERACTIONS_PER_DOC_TODAY
        setLastResult(
          `Published ${count} ${count === 1 ? 'draft' : 'drafts'} in ${interactions + 1} interactions, one-at-a-time today: ~${today}.`,
        )
        setSelected(new Set())
        setInteractions(0)
      }

      const handleDelete = () => {
        setInteractions((n) => n + 1)
        const count = selected.size
        const today = count * INTERACTIONS_PER_DOC_TODAY
        setDocs((prev) => prev.filter((doc) => !selected.has(doc.id)))
        setLastResult(
          `Deleted ${count} ${count === 1 ? 'document' : 'documents'} in ${interactions + 1} interactions, one-at-a-time today: ~${today}. (A real delete would speak Reference-Ledger first.)`,
        )
        setSelected(new Set())
        setInteractions(0)
      }

      return (
        <Stack gap={3} style={{maxWidth: 600}}>
          {/* Header: two explicit rows — the select-all well + count on top, and the action
              bar on its own row when a selection exists. Two rows (rather than one wrapping
              row) so the count and the actions can never collide at any width. */}
          <Card border padding={2} radius={2} tone={selected.size > 0 ? 'primary' : 'transparent'}>
            <Stack gap={3}>
              <Flex align="center" gap={3}>
                <Card
                  as="button"
                  radius={2}
                  padding={2}
                  onClick={toggleAll}
                  tone="inherit"
                  // Card-as-button fills its row by default; pin it to content width so the
                  // adjacent count Box (flex:1) is not collapsed to zero.
                  style={{flex: '0 0 auto', width: 'fit-content'}}
                >
                  <Flex align="center" gap={2}>
                    <Flex
                      align="center"
                      justify="center"
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 3,
                        border: '1px solid var(--card-border-color)',
                        background: allSelected ? 'var(--card-focus-ring-color)' : 'transparent',
                      }}
                    >
                      {allSelected && (
                        <Text size={0} style={{color: 'var(--card-bg-color)'}}>
                          <CheckmarkIcon />
                        </Text>
                      )}
                    </Flex>
                    <Text size={1}>{allSelected ? 'Clear all' : 'Select all'}</Text>
                  </Flex>
                </Card>
                <Box flex={1} style={{minWidth: 0}}>
                  <Text size={1} weight="medium" textOverflow="ellipsis">
                    {selected.size > 0 ? `${selected.size} selected` : `${docs.length} documents`}
                  </Text>
                </Box>
              </Flex>
              {selected.size > 0 && (
                <Flex gap={2} wrap="wrap">
                  {selected.size < docs.length && (
                    <UIButton
                      fontSize={1}
                      icon={ExpandIcon}
                      text={rangeArmed ? 'Click a row to extend…' : 'Extend to next click'}
                      mode="ghost"
                      selected={rangeArmed}
                      onClick={() => setRangeArmed((armed) => !armed)}
                    />
                  )}
                  <UIButton
                    fontSize={1}
                    icon={PublishIcon}
                    text={`Publish ${selectedDrafts.length}`}
                    tone="positive"
                    mode="ghost"
                    disabled={selectedDrafts.length === 0}
                    onClick={handlePublish}
                  />
                  <UIButton
                    fontSize={1}
                    icon={TrashIcon}
                    text="Delete"
                    tone="critical"
                    mode="ghost"
                    onClick={handleDelete}
                  />
                </Flex>
              )}
            </Stack>
          </Card>

          <Card border radius={2} overflow="hidden" style={{height: 320}}>
            {docs.length > 0 ? (
              <CommandList
                activeItemDataAttr="data-hovered"
                ariaLabel="Documents"
                ariaMultiselectable
                canReceiveFocus
                getItemSelected={getItemSelected}
                itemHeight={ITEM_HEIGHT}
                items={docs}
                padding={1}
                renderItem={render}
              />
            ) : (
              <Flex align="center" height="fill" justify="center" padding={4}>
                <Text size={1} muted>
                  Everything deleted, reload the story to start over.
                </Text>
              </Flex>
            )}
          </Card>

          <Flex gap={3} align="stretch">
            <Card border padding={3} radius={2} tone="transparent" flex={1}>
              <Stack gap={2}>
                <Text size={0} muted weight="medium">
                  Interaction meter (this selection)
                </Text>
                <Code size={1}>{String(interactions)}</Code>
              </Stack>
            </Card>
            <Card border padding={3} radius={2} tone="transparent" flex={2}>
              <Stack gap={2}>
                <Text size={0} muted weight="medium">
                  Last bulk action
                </Text>
                <Text size={1} muted>
                  {lastResult ??
                    'Try: click “Anna Karenina”, then shift-click “Persuasion”, or arm “Extend to next click” and click it. Then publish.'}
                </Text>
              </Stack>
            </Card>
          </Flex>
        </Stack>
      )
    }
    return <Demo />
  },
}
