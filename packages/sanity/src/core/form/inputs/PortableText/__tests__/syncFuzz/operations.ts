/**
 * Steps for the Portable Text sync fuzz test.
 *
 * Every step is plain data, so fast-check can print and shrink a failing list
 * of steps. Steps point at blocks, spans and offsets with plain numbers. When
 * a step runs, those numbers wrap around to fit the current document, so a
 * list of steps still makes sense while fast-check shortens it.
 */
import {makePatches, stringifyPatches} from '@sanity/diff-match-patch'
import {isKeySegment, type PortableTextBlock} from '@sanity/types'
import * as fc from 'fast-check'

import {type MutationPayload} from '../../../../../store/document/buffered-doc/types'
import {DOCUMENT_ID, FIELD, type Harness} from './harness'

/** Which of the two remote clients makes an edit. */
type Client = 0 | 1

export type Operation =
  // Local edits, sent to the editor the way its behaviors would.
  | {type: 'local.select'; block: number; child: number; offset: number; extend?: number}
  /** Put the cursor at the start or end of a block, where Enter and Backspace act differently. */
  | {type: 'local.selectEdge'; block: number; edge: 'start' | 'end'}
  | {type: 'local.insertText'; text: string}
  | {type: 'local.deleteBackward'}
  | {type: 'local.deleteForward'}
  | {type: 'local.insertBreak'}
  | {type: 'local.toggleDecorator'; decorator: 'strong' | 'em'}
  | {type: 'local.toggleStyle'; style: 'h1'}
  | {type: 'local.toggleList'}
  | {type: 'local.undo'}
  | {type: 'local.redo'}
  /** Select from the start of the first block to the end of the last one. */
  | {type: 'local.selectAll'}
  | {type: 'local.deleteBlock'; block: number}
  /** Paste one or two blocks of text at the cursor, replacing any selection. */
  | {type: 'local.paste'; text: string; lines?: 1 | 2}
  /** Add a link to the selected text. */
  | {type: 'local.addLink'}
  /** Remove links from the selected text. */
  | {type: 'local.removeLink'}
  /** Insert an inline object (a mention) at the cursor. */
  | {type: 'local.insertMention'}
  /**
   * Several local edits back to back, without letting React render in
   * between, like fast typing or a paste. The form's value then lags behind
   * the editor while the edits arrive.
   */
  | {type: 'local.burst'; steps: Operation[]}
  // Edits from one of the two remote clients, made on that client's own copy
  // of the document. They reach the server only on `remote.send`.
  | {
      type: 'remote.editText'
      client?: Client
      block: number
      child: number
      offset: number
      text: string
    }
  | {
      type: 'remote.deleteText'
      client?: Client
      block: number
      child: number
      offset: number
      length: number
    }
  | {
      type: 'remote.insertBlock'
      client?: Client
      block: number
      position: 'before' | 'after'
      text: string
      /**
       * Write the block the way a non-Studio client might: no `style`, no
       * `markDefs`, spans without `marks`, and two adjacent spans that PTE
       * merges. PTE has to fix it up while applying the remote change.
       */
      unnormalized?: boolean
    }
  | {type: 'remote.removeBlock'; client?: Client; block: number}
  | {type: 'remote.setStyle'; client?: Client; block: number; style: 'normal' | 'h1'}
  /**
   * Like `remote.setStyle`, but points at the block by index, as some clients
   * do. The index is valid on the client's copy, but the server and the
   * Studio may have other blocks by the time the patch arrives.
   */
  | {type: 'remote.setStyleByIndex'; client?: Client; block: number; style: 'normal' | 'h1'}
  /** The client sends its held edits to the server. */
  | {type: 'remote.send'; client?: Client}
  /** The client's copy catches up with the server, keeping its unsent edits on top. */
  | {type: 'remote.catchUp'; client?: Client}
  // Network and clock: things that normally happen on their own schedule.
  | {type: 'sync.commit'}
  | {type: 'sync.acceptCommit'}
  | {type: 'sync.deliverListenerEvent'}
  | {type: 'time.advance'; ms: number}

const index = fc.nat({max: 20})
const shortText = fc.constantFrom('a', 'bc', ' ', 'xyz', 'Q')
const anyClient = fc.constantFrom<Client>(0, 1)
const firstClient = fc.constant<Client>(0)

function operation<T extends Operation>(fields: {
  [K in keyof T]: fc.Arbitrary<T[K]>
}): fc.Arbitrary<T> {
  return fc.record(fields) as unknown as fc.Arbitrary<T>
}

const local = {
  // Not built with `operation()`, which makes every key required: `extend`
  // is optional here, and a select without it leaves the selection collapsed.
  select: fc.record(
    {
      type: fc.constant('local.select' as const),
      block: index,
      child: index,
      offset: index,
      extend: index,
    },
    {requiredKeys: ['type', 'block', 'child', 'offset']},
  ),
  collapsedSelect: operation({
    type: fc.constant('local.select' as const),
    block: index,
    child: index,
    offset: index,
  }),
  selectEdge: operation({
    type: fc.constant('local.selectEdge' as const),
    block: index,
    edge: fc.constantFrom('start' as const, 'end' as const),
  }),
  insertText: operation({type: fc.constant('local.insertText' as const), text: shortText}),
  deleteBackward: fc.constant({type: 'local.deleteBackward' as const}),
  deleteForward: fc.constant({type: 'local.deleteForward' as const}),
  insertBreak: fc.constant({type: 'local.insertBreak' as const}),
  toggleDecorator: operation({
    type: fc.constant('local.toggleDecorator' as const),
    decorator: fc.constantFrom('strong' as const, 'em' as const),
  }),
  toggleStyle: operation({
    type: fc.constant('local.toggleStyle' as const),
    style: fc.constant('h1' as const),
  }),
  toggleList: fc.constant({type: 'local.toggleList' as const}),
  undo: fc.constant({type: 'local.undo' as const}),
  redo: fc.constant({type: 'local.redo' as const}),
  selectAll: fc.constant({type: 'local.selectAll' as const}),
  deleteBlock: operation({type: fc.constant('local.deleteBlock' as const), block: index}),
  paste: operation({
    type: fc.constant('local.paste' as const),
    text: shortText,
    lines: fc.constantFrom(1 as const, 2 as const),
  }),
  addLink: fc.constant({type: 'local.addLink' as const}),
  removeLink: fc.constant({type: 'local.removeLink' as const}),
  insertMention: fc.constant({type: 'local.insertMention' as const}),
}

function remoteArbitraries(client: fc.Arbitrary<Client>) {
  return {
    editText: operation({
      type: fc.constant('remote.editText' as const),
      client,
      block: index,
      child: index,
      offset: index,
      text: shortText,
    }),
    deleteText: operation({
      type: fc.constant('remote.deleteText' as const),
      client,
      block: index,
      child: index,
      offset: index,
      length: fc.integer({min: 1, max: 4}),
    }),
    insertBlock: operation({
      type: fc.constant('remote.insertBlock' as const),
      client,
      block: index,
      position: fc.constantFrom('before' as const, 'after' as const),
      text: shortText,
      unnormalized: fc.boolean(),
    }),
    insertNormalizedBlock: operation({
      type: fc.constant('remote.insertBlock' as const),
      client,
      block: index,
      position: fc.constantFrom('before' as const, 'after' as const),
      text: shortText,
      unnormalized: fc.constant(false),
    }),
    removeBlock: operation({
      type: fc.constant('remote.removeBlock' as const),
      client,
      block: index,
    }),
    setStyle: operation({
      type: fc.constant('remote.setStyle' as const),
      client,
      block: index,
      style: fc.constantFrom('normal' as const, 'h1' as const),
    }),
    setStyleByIndex: operation({
      type: fc.constant('remote.setStyleByIndex' as const),
      client,
      block: index,
      style: fc.constantFrom('normal' as const, 'h1' as const),
    }),
    send: operation({type: fc.constant('remote.send' as const), client}),
    catchUp: operation({type: fc.constant('remote.catchUp' as const), client}),
  }
}

const remote = remoteArbitraries(anyClient)
const singleRemote = remoteArbitraries(firstClient)

const sync = {
  commit: fc.constant({type: 'sync.commit' as const}),
  acceptCommit: fc.constant({type: 'sync.acceptCommit' as const}),
  deliverListenerEvent: fc.constant({type: 'sync.deliverListenerEvent' as const}),
  advanceTime: operation({
    type: fc.constant('time.advance' as const),
    // Around PTE's 10ms busy check, 250ms typing debounce, 500ms (test env)
    // mutation flush interval and 1s value sync retry.
    ms: fc.constantFrom(0, 10, 100, 249, 251, 500, 1000),
  }),
}

const burst = operation({
  type: fc.constant('local.burst' as const),
  steps: fc.array(
    fc.oneof(
      local.select,
      local.selectEdge,
      local.selectAll,
      local.insertText,
      local.insertBreak,
      local.deleteBackward,
      local.deleteForward,
      local.deleteBlock,
      local.paste,
      local.toggleList,
      local.addLink,
      local.insertMention,
    ),
    {minLength: 2, maxLength: 6},
  ),
})

const syncOperations = [
  {weight: 2, arbitrary: sync.commit},
  {weight: 2, arbitrary: sync.acceptCommit},
  {weight: 3, arbitrary: sync.deliverListenerEvent},
  {weight: 3, arbitrary: sync.advanceTime},
]

const localEdits = [
  {weight: 3, arbitrary: local.select},
  {weight: 2, arbitrary: local.selectEdge},
  {weight: 5, arbitrary: local.insertText},
  {weight: 2, arbitrary: local.deleteBackward},
  {weight: 1, arbitrary: local.deleteForward},
  {weight: 2, arbitrary: local.insertBreak},
  {weight: 1, arbitrary: local.toggleDecorator},
  {weight: 1, arbitrary: local.toggleStyle},
  {weight: 1, arbitrary: local.toggleList},
  {weight: 1, arbitrary: local.undo},
  {weight: 1, arbitrary: local.redo},
  {weight: 1, arbitrary: local.selectAll},
  {weight: 1, arbitrary: local.deleteBlock},
  {weight: 1, arbitrary: local.paste},
  {weight: 1, arbitrary: local.addLink},
  {weight: 1, arbitrary: local.removeLink},
  {weight: 1, arbitrary: local.insertMention},
]

/** Every operation the fuzzer knows. */
export const operationArbitrary: fc.Arbitrary<Operation> = fc.oneof(
  ...localEdits,
  {weight: 2, arbitrary: burst},
  {weight: 3, arbitrary: remote.editText},
  {weight: 1, arbitrary: remote.deleteText},
  {weight: 1, arbitrary: remote.insertBlock},
  {weight: 1, arbitrary: remote.removeBlock},
  {weight: 1, arbitrary: remote.setStyle},
  {weight: 1, arbitrary: remote.setStyleByIndex},
  // Frequent, so remote edits reach the server (and then the Studio) often
  // enough to matter.
  {weight: 6, arbitrary: remote.send},
  {weight: 3, arbitrary: remote.catchUp},
  ...syncOperations,
)

/**
 * Steps that never remove text: only a cursor (typing over a selected range
 * deletes it), no deletes, no undo or redo, and a single remote client whose
 * edits only insert. Run them with `{partitioned: true}`, so the local user
 * and the remote client never edit the same block. With these rules every
 * patch should apply cleanly, and every character anyone typed must still be
 * there at the end. That makes lost edits something the test can count.
 *
 * Keeping the two users in separate blocks leaves out losses that any
 * patch-based sync has when two people edit the same text at once. The test
 * would otherwise find these over and over:
 * - PTE sends a split (of a block, or of a span when typing with a decorator
 *   turned on) as "delete the end of this text" plus "insert a copy of it
 *   there". A remote insert into that end, still on its way, is lost.
 * - diff-match-patch drops a patch when the text around it has changed too
 *   much. In a short span, a few nearby characters from someone else are
 *   enough.
 * That is also why there is only one remote client here: two could edit the
 * same text.
 *
 * Remote blocks are always written in full here (with `style`, `markDefs` and
 * `marks`). PTE fixes up an incomplete block itself, for example by merging
 * its adjacent spans. That is a local patch to a block the remote client
 * owns, which would break the rule that the two users edit separate blocks.
 */
export const insertOnlyOperationArbitrary: fc.Arbitrary<Operation> = fc.oneof(
  {weight: 3, arbitrary: local.collapsedSelect},
  {weight: 2, arbitrary: local.selectEdge},
  {weight: 5, arbitrary: local.insertText},
  {weight: 2, arbitrary: local.insertBreak},
  {weight: 1, arbitrary: local.toggleDecorator},
  {weight: 1, arbitrary: local.toggleStyle},
  {weight: 1, arbitrary: local.toggleList},
  {weight: 1, arbitrary: local.insertMention},
  {weight: 4, arbitrary: singleRemote.editText},
  {weight: 1, arbitrary: singleRemote.insertNormalizedBlock},
  {weight: 1, arbitrary: singleRemote.setStyle},
  {weight: 3, arbitrary: singleRemote.send},
  {weight: 1, arbitrary: singleRemote.catchUp},
  ...syncOperations,
)

/**
 * Only the local user edits, and nobody else. With no one else editing,
 * whatever the editor shows after the last step is exactly what should be
 * saved.
 */
export const localOnlyOperationArbitrary: fc.Arbitrary<Operation> = fc.oneof(
  ...localEdits,
  {weight: 3, arbitrary: burst},
  ...syncOperations,
)

/** Whether `localOnlyOperationArbitrary` can produce this operation. */
export function isLocalOnlyOperation(op: Operation): boolean {
  return !op.type.startsWith('remote.')
}

/** Whether `insertOnlyOperationArbitrary` can produce this operation. */
export function isInsertOnlyOperation(op: Operation): boolean {
  if (op.type.startsWith('remote.') && 'client' in op && op.client === 1) return false
  switch (op.type) {
    case 'local.select':
      return op.extend === undefined
    case 'local.deleteBackward':
    case 'local.deleteForward':
    case 'local.undo':
    case 'local.redo':
    case 'local.selectAll':
    case 'local.deleteBlock':
    case 'local.paste':
    case 'local.addLink':
    case 'local.removeLink':
    case 'local.burst':
    case 'remote.deleteText':
    case 'remote.removeBlock':
    case 'remote.setStyleByIndex':
      return false
    case 'remote.insertBlock':
      return !op.unnormalized
    default:
      return true
  }
}

/** Blocks the remote client owns in partitioned runs: `b2` and every block it inserts. */
export function isRemoteOwned(block: PortableTextBlock): boolean {
  return block._key === 'b2' || block._key.startsWith('remote')
}

export interface RunOptions {
  /**
   * Keep the local user and the remote client in separate blocks: local
   * selections resolve only to blocks the remote client does not own, remote
   * edits only to blocks it does.
   */
  partitioned?: boolean
  /** Don't let React and pending work run after the step (used inside a burst). */
  noFlush?: boolean
}

/** Counts every character in a value's spans. */
export function countCharacters(value: PortableTextBlock[] | undefined): Map<string, number> {
  const counts = new Map<string, number>()
  for (const block of value ?? []) {
    if (!isTextBlock(block)) continue
    for (const child of block.children) {
      for (const character of child.text ?? '') {
        counts.set(character, (counts.get(character) ?? 0) + 1)
      }
    }
  }
  return counts
}

interface TextTarget {
  block: PortableTextBlock & {children: Array<{_key: string; _type: string; text?: string}>}
  span: {_key: string; _type: string; text?: string}
}

function isTextBlock(block: PortableTextBlock): block is TextTarget['block'] {
  return block._type === 'block' && Array.isArray(block.children)
}

/** Finds the span for a (block, child) index pair, wrapping around to fit the current value. */
function resolveSpan(
  value: PortableTextBlock[] | undefined,
  blockIndex: number,
  childIndex: number,
): TextTarget | undefined {
  const textBlocks = (value ?? []).filter(isTextBlock)
  if (textBlocks.length === 0) return undefined
  const block = textBlocks[blockIndex % textBlocks.length]
  const spans = block.children.filter((child) => child._type === 'span')
  if (spans.length === 0) return undefined
  return {block, span: spans[childIndex % spans.length]}
}

let remoteKeyCounter = 0
function remoteKey(): string {
  remoteKeyCounter += 1
  return `remote${remoteKeyCounter}`
}

function textPath(target: TextTarget): string {
  return `${FIELD}[_key=="${target.block._key}"].children[_key=="${target.span._key}"].text`
}

function remoteTextEdit(target: TextTarget, nextText: string): MutationPayload {
  const patch = stringifyPatches(makePatches(target.span.text ?? '', nextText))
  return {patch: {id: DOCUMENT_ID, diffMatchPatch: {[textPath(target)]: patch}}}
}

export interface OperationResult {
  /** Text the local user typed, if the operation ran. */
  localInserted: string
  /** Text a remote client's edits inserted on the server, if they were sent. */
  remoteInserted: string
}

const NOTHING: OperationResult = {localInserted: '', remoteInserted: ''}

/** Runs one operation. Operations that do not apply to the current state are no-ops. */
export async function runOperation(
  harness: Harness,
  op: Operation,
  options: RunOptions = {},
): Promise<OperationResult> {
  const {server} = harness
  const ownedBy = (owner: 'local' | 'remote') => (value: PortableTextBlock[] | undefined) =>
    options.partitioned
      ? (value ?? []).filter((block) => isRemoteOwned(block) === (owner === 'remote'))
      : value
  let localInserted = ''
  let remoteInserted = ''
  const client = harness.remoteClients['client' in op ? (op.client ?? 0) : 0]
  const clientBody = client.view[FIELD] as PortableTextBlock[] | undefined

  if (
    options.partitioned &&
    op.type.startsWith('local.') &&
    op.type !== 'local.select' &&
    op.type !== 'local.selectEdge'
  ) {
    // Without a selection PTE edits at the end of the document, and the
    // selection can also sit in a block the remote client owns once blocks
    // move around. Either would let the local user edit a remote block.
    const focusSegment = harness.editor().getSnapshot().context.selection?.focus.path[0]
    const focusKey =
      focusSegment !== undefined && isKeySegment(focusSegment) ? focusSegment._key : undefined
    const focusBlock = harness.editorValue()?.find((block) => block._key === focusKey)
    if (!focusBlock || isRemoteOwned(focusBlock)) return NOTHING
  }

  switch (op.type) {
    case 'local.select': {
      const value = ownedBy('local')(harness.editorValue())
      const anchor = resolveSpan(value, op.block, op.child)
      if (!anchor) return NOTHING
      const anchorPoint = {
        path: [{_key: anchor.block._key}, 'children', {_key: anchor.span._key}],
        offset: op.offset % ((anchor.span.text ?? '').length + 1),
      }
      let focusPoint = anchorPoint
      if (op.extend !== undefined) {
        const focus = resolveSpan(value, op.block + op.extend, op.child + op.extend)
        if (focus) {
          focusPoint = {
            path: [{_key: focus.block._key}, 'children', {_key: focus.span._key}],
            offset: op.extend % ((focus.span.text ?? '').length + 1),
          }
        }
      }
      // No `focus` event: jsdom has no layout, so PTE's DOM focus fails. The
      // selection is all the editing behaviors need.
      harness.editor().send({type: 'select', at: {anchor: anchorPoint, focus: focusPoint}})
      break
    }
    case 'local.selectEdge': {
      const textBlocks = (ownedBy('local')(harness.editorValue()) ?? []).filter(isTextBlock)
      if (textBlocks.length === 0) return NOTHING
      const block = textBlocks[op.block % textBlocks.length]
      const spans = block.children.filter((child) => child._type === 'span')
      const span = op.edge === 'start' ? spans[0] : spans.at(-1)
      if (!span) return NOTHING
      const point = {
        path: [{_key: block._key}, 'children', {_key: span._key}],
        offset: op.edge === 'start' ? 0 : (span.text ?? '').length,
      }
      harness.editor().send({type: 'select', at: {anchor: point, focus: point}})
      break
    }
    case 'local.insertText':
      harness.editor().send({type: 'insert.text', text: op.text})
      localInserted = op.text
      break
    case 'local.deleteBackward':
      harness.editor().send({type: 'delete.backward', unit: 'character'})
      break
    case 'local.deleteForward':
      harness.editor().send({type: 'delete.forward', unit: 'character'})
      break
    case 'local.insertBreak':
      harness.editor().send({type: 'insert.break'})
      break
    case 'local.toggleDecorator':
      harness.editor().send({type: 'decorator.toggle', decorator: op.decorator})
      break
    case 'local.toggleStyle':
      harness.editor().send({type: 'style.toggle', style: op.style})
      break
    case 'local.toggleList':
      harness.editor().send({type: 'list item.toggle', listItem: 'bullet'})
      break
    case 'local.undo':
      harness.editor().send({type: 'history.undo'})
      break
    case 'local.redo':
      harness.editor().send({type: 'history.redo'})
      break
    case 'local.selectAll': {
      const textBlocks = (ownedBy('local')(harness.editorValue()) ?? []).filter(isTextBlock)
      const first = textBlocks[0]
      const last = textBlocks.at(-1)
      const firstSpan = first?.children.find((child) => child._type === 'span')
      const lastSpan = last?.children.findLast((child) => child._type === 'span')
      if (!first || !last || !firstSpan || !lastSpan) return NOTHING
      harness.editor().send({
        type: 'select',
        at: {
          anchor: {path: [{_key: first._key}, 'children', {_key: firstSpan._key}], offset: 0},
          focus: {
            path: [{_key: last._key}, 'children', {_key: lastSpan._key}],
            offset: (lastSpan.text ?? '').length,
          },
        },
      })
      break
    }
    case 'local.deleteBlock': {
      const blocks = ownedBy('local')(harness.editorValue()) ?? []
      if (blocks.length === 0) return NOTHING
      const block = blocks[op.block % blocks.length]
      harness.editor().send({type: 'delete.block', at: [{_key: block._key}]})
      break
    }
    case 'local.paste': {
      const lines = op.lines ?? 1
      harness.editor().send({
        type: 'insert.blocks',
        blocks: Array.from({length: lines}, () => ({
          _type: 'block',
          children: [{_type: 'span', text: op.text}],
        })),
        placement: 'auto',
      })
      localInserted = op.text.repeat(lines)
      break
    }
    case 'local.addLink':
      harness.editor().send({
        type: 'annotation.add',
        annotation: {name: 'link', value: {href: 'https://example.com'}},
      })
      break
    case 'local.removeLink':
      harness.editor().send({type: 'annotation.remove', annotation: {name: 'link'}})
      break
    case 'local.insertMention':
      harness.editor().send({
        type: 'insert.inline object',
        inlineObject: {name: 'mention', value: {name: 'someone'}},
      })
      break
    case 'local.burst':
      for (const step of op.steps) {
        const result = await runOperation(harness, step, {...options, noFlush: true})
        localInserted += result.localInserted
      }
      break

    case 'remote.editText': {
      const target = resolveSpan(ownedBy('remote')(clientBody), op.block, op.child)
      if (!target) return NOTHING
      const text = target.span.text ?? ''
      const at = op.offset % (text.length + 1)
      client.edit([remoteTextEdit(target, text.slice(0, at) + op.text + text.slice(at))], op.text)
      break
    }
    case 'remote.deleteText': {
      const target = resolveSpan(clientBody, op.block, op.child)
      if (!target) return NOTHING
      const text = target.span.text ?? ''
      if (text.length === 0) return NOTHING
      const at = op.offset % text.length
      client.edit([remoteTextEdit(target, text.slice(0, at) + text.slice(at + op.length))], '')
      break
    }
    case 'remote.insertBlock': {
      const newBlock = op.unnormalized
        ? {
            _key: remoteKey(),
            _type: 'block',
            children: [
              {_key: remoteKey(), _type: 'span', text: op.text},
              {_key: remoteKey(), _type: 'span', text: op.text},
            ],
          }
        : {
            _key: remoteKey(),
            _type: 'block',
            style: 'normal',
            markDefs: [],
            children: [{_key: remoteKey(), _type: 'span', text: op.text, marks: []}],
          }
      const inserted = op.unnormalized ? op.text + op.text : op.text
      if (!clientBody || clientBody.length === 0) {
        client.edit(
          [
            {patch: {id: DOCUMENT_ID, setIfMissing: {[FIELD]: []}}},
            {patch: {id: DOCUMENT_ID, insert: {after: `${FIELD}[-1]`, items: [newBlock]}}},
          ],
          inserted,
        )
      } else {
        const anchor = clientBody[op.block % clientBody.length]
        client.edit(
          [
            {
              patch: {
                id: DOCUMENT_ID,
                insert: {[op.position]: `${FIELD}[_key=="${anchor._key}"]`, items: [newBlock]},
              },
            },
          ],
          inserted,
        )
      }
      break
    }
    case 'remote.removeBlock': {
      if (!clientBody || clientBody.length === 0) return NOTHING
      const block = clientBody[op.block % clientBody.length]
      client.edit([{patch: {id: DOCUMENT_ID, unset: [`${FIELD}[_key=="${block._key}"]`]}}], '')
      break
    }
    case 'remote.setStyle': {
      const textBlocks = (ownedBy('remote')(clientBody) ?? []).filter(isTextBlock)
      if (textBlocks.length === 0) return NOTHING
      const block = textBlocks[op.block % textBlocks.length]
      client.edit(
        [{patch: {id: DOCUMENT_ID, set: {[`${FIELD}[_key=="${block._key}"].style`]: op.style}}}],
        '',
      )
      break
    }
    case 'remote.setStyleByIndex': {
      if (!clientBody || clientBody.length === 0) return NOTHING
      client.edit(
        [
          {
            patch: {
              id: DOCUMENT_ID,
              set: {[`${FIELD}[${op.block % clientBody.length}].style`]: op.style},
            },
          },
        ],
        '',
      )
      break
    }
    case 'remote.send':
      remoteInserted = client.send()
      break
    case 'remote.catchUp':
      client.catchUp()
      break

    case 'sync.commit':
      harness.commit()
      break
    case 'sync.acceptCommit':
      server.acceptCommit()
      break
    case 'sync.deliverListenerEvent':
      harness.deliverListenerEvent()
      break
    case 'time.advance':
      await harness.advance(op.ms)
      return NOTHING
    default:
      op satisfies never
  }

  // Let React effects, observable subscriptions and microtasks run, without
  // moving the clock: only `time.advance` does that.
  if (!options.noFlush) await harness.advance(0)
  return {localInserted, remoteInserted}
}
