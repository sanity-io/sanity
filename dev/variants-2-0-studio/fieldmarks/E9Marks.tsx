import {Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {
  type CSSProperties,
  type FocusEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  type BlockProps,
  type FieldProps,
  type FieldSetRollupArgs,
  type InputProps,
  type ItemProps,
  useClient,
  useSchema,
  useUser,
} from 'sanity'

import {Popover} from '../../../packages/sanity/src/ui-components/popover/Popover'
import {useOption} from '../design-options/store'
import {BlockWithMark, FieldWithRemovedNote} from './FieldMarkCandidates'
import {
  arrayKinds,
  type Claim,
  claimsOf,
  describe,
  get,
  type ItemKind,
  type Json,
  type Seg,
  unknownKeys,
} from './markModel'
import {useIsSelected} from './selection'
import {type MarkData, useMarkData} from './useMarkData'

// E9 field marks (switch `fieldMarks`): A = the shipped marks (untouched), B = complete marks, C = B plus a peek.
// Through the public form.components overrides only (field, item, block, input). The left gutter keeps the stock rhombus (which version).
// The right gutter gets ONE mark per field: a purple bar and a word, by priority changed > diverged > differs from base (F2-D).
//   Changed            the value differs from the published version at the same address (a draft edit)
//   Differs from base  a variant's value differs from its base (never "customised", F2-AC3)
//   N changed inside   the roll-up on an object, an array or a collapsed container (F2-AC1)
//   Added / Removed / Moved on array items and blocks: green and red are reserved for added and removed (1 Oct decision); each has a
//   word, so the marks read without colour (F2-AC2). The mark is a button of at least 24 x 24 with a focus ring (F2-AC8).
// The stock amber change bar is hidden while B or C is on (it stays in the DOM: the mark forwards its press to it, which is the
// connector to Review changes). In C the mark opens a peek: before and after, the author, and "Open comparison" (F2-AC4: 2 actions).

type Path = readonly Seg[]

const TONE = {
  changed: {
    bar: 'var(--card-badge-suggest-dot-color)',
    fg: 'var(--card-badge-suggest-fg-color)',
    word: 'Changed',
  },
  differs: {
    bar: 'var(--card-badge-suggest-dot-color)',
    fg: 'var(--card-badge-suggest-fg-color)',
    word: 'Differs from base',
  },
  diverged: {
    bar: 'var(--card-badge-caution-dot-color)',
    fg: 'var(--card-badge-caution-fg-color)',
    word: 'Diverged',
  },
  added: {
    bar: 'var(--card-badge-positive-dot-color)',
    fg: 'var(--card-badge-positive-fg-color)',
    word: 'Added',
  },
  removed: {
    bar: 'var(--card-badge-critical-dot-color)',
    fg: 'var(--card-badge-critical-fg-color)',
    word: 'Removed',
  },
  moved: {
    bar: 'var(--card-badge-suggest-dot-color)',
    fg: 'var(--card-badge-suggest-fg-color)',
    word: 'Moved',
  },
} as const
type Tone = keyof typeof TONE

/** The bar's stroke tells the kinds apart without colour: solid = changed, dashed = differs from base, dotted = moved. */
const STROKE: Record<Tone, 'solid' | 'dashed' | 'dotted'> = {
  changed: 'solid',
  differs: 'dashed',
  diverged: 'solid',
  added: 'solid',
  removed: 'solid',
  moved: 'dotted',
}

const GUTTER_WIDTH = 84
const MIN_WORD = 58

/** How much room is left between a wrapper's right edge and the pane's: when there is none, the mark is the bar alone. */
function useRoom(ref: {current: HTMLElement | null}): number {
  const [roomy, setRoomy] = useState(GUTTER_WIDTH)
  useEffect(() => {
    const el = ref.current
    const pane = el?.closest('[data-testid="document-pane"]') as HTMLElement | null
    if (!el || !pane) return undefined
    const measure = () =>
      setRoomy(
        Math.floor(pane.getBoundingClientRect().right - el.getBoundingClientRect().right - 14),
      )
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(pane)
    return () => observer.disconnect()
  }, [ref])
  return roomy
}

/** The stock change bar's button inside a wrapper, if there is one: the connector to Review changes. */
const forwardPress = (wrapper: HTMLElement | null) =>
  (wrapper?.querySelector('[data-testid="change-bar__button"]') as HTMLElement | null)?.click()

export function openComparison(wrapper: HTMLElement | null) {
  // The Compare options (E9 step 4) listen for this; until then it is the connector to Review changes.
  window.dispatchEvent(new CustomEvent('e9:open-comparison', {detail: {}}))
  forwardPress(wrapper)
}

interface MarkSpec {
  tone: Tone
  /** The word beside the bar (null: the bar alone, in the description only). */
  label: string
  /** The accessible description, always complete. */
  title: string
  /** A bar the height of the header only (containers) or the whole field (leaves). */
  header: boolean
  claims: Claim[]
  before: Json
  after: Json
  path: Path
  docId: string | null
}

const BAR_CSS = `
[data-e9-mark] { background: none; border: 0; cursor: pointer; display: flex; font: inherit; gap: 6px; padding: 0; text-align: left; }
[data-e9-mark][data-selected] [data-e9-bar] { width: 7px; }
[data-e9-mark]:focus-visible { outline: 2px solid var(--card-focus-ring-color); outline-offset: 1px; border-radius: 3px; }
[data-e9-mark] [data-e9-bar] { flex: none; width: 3px; transition: width 120ms; border-radius: 2px; align-self: stretch; }
[data-e9-mark] [data-e9-word] { font-size: 11px; line-height: 14px; font-weight: 600; width: ${GUTTER_WIDTH - 10}px; white-space: normal; overflow-wrap: normal; padding-top: 1px; }
[data-testid="change-bar__marker"], [data-testid="change-bar__button"] { opacity: 0 !important; pointer-events: none !important; }
`

function Stroke(props: {tone: Tone}) {
  const t = TONE[props.tone]
  const stroke = STROKE[props.tone]
  return (
    <span
      data-e9-bar=""
      style={{
        background:
          stroke === 'solid'
            ? t.bar
            : `repeating-linear-gradient(to bottom, ${t.bar} 0 ${stroke === 'dashed' ? 6 : 2}px, transparent ${stroke === 'dashed' ? 6 : 2}px ${stroke === 'dashed' ? 10 : 5}px)`,
      }}
    />
  )
}

function useLastEdit(docId: string | null, enabled: boolean) {
  const client = useClient({apiVersion: '2024-01-01'})
  const [edit, setEdit] = useState<{author: string; at: string} | null>(null)
  useEffect(() => {
    if (!enabled || !docId) return undefined
    let cancelled = false
    const {token} = client.config()
    void fetch(
      client.getUrl(
        `/data/history/${client.config().dataset}/transactions/${encodeURIComponent(docId)}?limit=1&excludeContent=true&reverse=true`,
      ),
      {
        credentials: 'include',
        headers: token ? {Authorization: `Bearer ${token}`} : undefined,
      },
    )
      .then((r) => (r.ok ? r.text() : ''))
      .then((text) => {
        const line = text.split('\n').find(Boolean)
        if (!line || cancelled) return
        const row = JSON.parse(line) as {author?: string; timestamp?: string}
        if (row.author && row.timestamp) setEdit({author: row.author, at: row.timestamp})
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [client, docId, enabled])
  return edit
}

function Author(props: {id: string}) {
  const [user] = useUser(props.id)
  return <>{user?.displayName ?? 'A teammate'}</>
}

function Peek(props: {spec: MarkSpec; onOpen: () => void}) {
  const {spec} = props
  const edit = useLastEdit(spec.docId, true)
  const time = edit
    ? new Date(edit.at).toLocaleString(undefined, {dateStyle: 'medium', timeStyle: 'short'})
    : null
  return (
    <Card data-testid="e9-peek" padding={3} style={{width: 280}}>
      <Stack gap={3}>
        <Stack gap={2}>
          {spec.claims.map((claim) => (
            <Text key={claim.kind} size={1} weight="semibold">
              {claim.kind === 'changed' ? 'Changed since Published' : 'Differs from base'}
              {claim.count > 1 ? ` · ${claim.count} changes` : ''}
            </Text>
          ))}
        </Stack>
        <Stack gap={1}>
          <Text muted size={0}>
            Before
          </Text>
          <Card padding={2} radius={2} tone="critical">
            <Text data-testid="e9-peek-before" size={1}>
              {describe(spec.before)}
            </Text>
          </Card>
        </Stack>
        <Stack gap={1}>
          <Text muted size={0}>
            After
          </Text>
          <Card padding={2} radius={2} tone="positive">
            <Text data-testid="e9-peek-after" size={1}>
              {describe(spec.after)}
            </Text>
          </Card>
        </Stack>
        <Text muted size={0}>
          {edit ? (
            <>
              Edited by <Author id={edit.author} /> · {time}
            </>
          ) : (
            'Author not available'
          )}
        </Text>
        <Button mode="ghost" onClick={props.onOpen} text="Open comparison" tone="primary" />
      </Stack>
    </Card>
  )
}

function GutterMark(props: {
  spec: MarkSpec
  wrapper: {current: HTMLElement | null}
  peek: boolean
}) {
  const {spec, wrapper, peek} = props
  const room = useRoom(wrapper)
  const selected = useIsSelected(spec.path)
  const roomy = room >= MIN_WORD
  const wordWidth = Math.min(GUTTER_WIDTH - 10, room - 12)
  const [open, setOpen] = useState(false)
  const tone = TONE[spec.tone]
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const focusedAt = useRef(0)
  const press = useCallback(() => {
    // A focus that opened the peek a moment ago must not be undone by the press that follows it.
    if (peek) setOpen((o) => (Date.now() - focusedAt.current < 600 ? true : !o))
    else forwardPress(wrapper.current)
  }, [peek, wrapper])
  const focus = useCallback(
    (event: FocusEvent<HTMLButtonElement>) => {
      if (peek && event.currentTarget.matches(':focus-visible')) {
        focusedAt.current = Date.now()
        setOpen(true)
      }
    },
    [peek],
  )
  const button = (
    <button
      aria-expanded={peek ? open : undefined}
      aria-label={spec.title}
      data-e9-mark=""
      data-kind={spec.tone}
      data-selected={selected ? '' : undefined}
      data-testid="e9-mark"
      onClick={press}
      onFocus={focus}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(false)
      }}
      ref={buttonRef}
      style={{
        color: tone.fg,
        // At least 24 x 24 to hit, however short the field.
        minHeight: 24,
        minWidth: 24,
        position: 'absolute',
        top: 0,
        bottom: spec.header ? undefined : 0,
        height: spec.header ? 28 : undefined,
        left: '100%',
        marginLeft: 6,
      }}
      title={spec.title}
      type="button"
    >
      <Stroke tone={spec.tone} />
      {roomy ? (
        <span data-e9-word="" style={{color: tone.fg, width: wordWidth}}>
          {spec.label}
        </span>
      ) : null}
    </button>
  )
  if (!peek) return button
  return (
    <Popover
      content={
        open ? <Peek onOpen={() => openComparison(wrapper.current)} spec={spec} /> : <span />
      }
      open={open}
      placement="left-start"
      portal
    >
      {button}
    </Popover>
  )
}

/** The wrapper that anchors the right-gutter mark to the field it belongs to. */
function Marked(props: {
  children: ReactNode
  spec: MarkSpec | null
  peek: boolean
  style?: CSSProperties
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  return (
    <div data-testid="e9-marked" ref={ref} style={{position: 'relative', ...props.style}}>
      {props.children}
      {props.spec ? <GutterMark peek={props.peek} spec={props.spec} wrapper={ref} /> : null}
    </div>
  )
}

const asPath = (path: readonly unknown[]): Path => path as Path

function specFor(
  data: MarkData,
  path: Path,
  value: Json,
  container: boolean,
  docId: string | null,
): MarkSpec | null {
  const claims = claimsOf(
    get(data.published, path),
    get(data.base, path),
    value,
    data.published !== null,
    data.base !== null,
  )
  const top = claims.top
  if (!top) return null
  const rollup = container || top.count > 1
  const label =
    top.kind === 'changed'
      ? rollup
        ? `${top.count} changed inside`
        : 'Changed'
      : rollup
        ? `${top.count} differ from base`
        : 'Differs from base'
  const refDoc = top.kind === 'changed' ? data.published : data.base
  return {
    tone: top.kind,
    label,
    title: `${label}${top.kind === 'changed' ? ': differs from the published version' : ''}`,
    header: container,
    claims: claims.all,
    before: get(refDoc, path),
    after: value,
    path,
    docId,
  }
}

function MarkedField(props: FieldProps & {peek: boolean}) {
  const {peek, ...fieldProps} = props
  const data = useMarkData()
  const path = asPath(fieldProps.path)
  const container =
    fieldProps.schemaType.jsonType === 'object' || fieldProps.schemaType.jsonType === 'array'
  const spec = specFor(data, path, fieldProps.value as Json, container, data.baseId)
  const rendered = fieldProps.renderDefault(fieldProps)
  // Removed items have no node: a note under the array names them (red, with the word).
  const ref = spec && spec.tone === 'changed' ? data.published : data.base
  const removed =
    fieldProps.schemaType.jsonType === 'array' && ref
      ? arrayKinds(get(ref, path), fieldProps.value as Json).removed
      : []
  return (
    <>
      <Marked peek={peek} spec={spec}>
        {rendered}
      </Marked>
      {removed.length ? (
        <Card
          data-testid="e9-removed-note"
          marginLeft={5}
          marginRight={5}
          marginTop={2}
          padding={2}
          radius={2}
          tone="critical"
        >
          <Flex align="center" gap={2}>
            <span
              aria-hidden="true"
              style={{
                background: TONE.removed.bar,
                borderRadius: 2,
                flex: 'none',
                height: 14,
                width: 3,
              }}
            />
            <Text size={1} style={{color: TONE.removed.fg}} weight="semibold">
              Removed
            </Text>
            <Text muted size={1}>
              {removed.map((item) => describe(item)).join(', ')}
            </Text>
          </Flex>
        </Card>
      ) : null}
    </>
  )
}

export function E9Field(props: FieldProps) {
  const option = useOption('fieldMarks')
  if (option === 'a') return <FieldWithRemovedNote {...props} />
  return <MarkedField {...props} peek={option === 'c'} />
}

// ---- Array items -----------------------------------------------------------------------------------------------------

function itemSpec(data: MarkData, path: Path, value: Json): MarkSpec | null {
  const parent = path.slice(0, -1)
  const last = path[path.length - 1]
  const current = get(data.current, parent)
  if (!Array.isArray(current)) return null
  const index =
    typeof last === 'number'
      ? last
      : current.findIndex((i) => (i as {_key?: string})?._key === (last as {_key: string})._key)
  if (index < 0) return null
  const pick = (ref: Json | null, claim: 'changed' | 'differs') => {
    if (ref === null) return null
    const refArray = get(ref, parent)
    if (!Array.isArray(refArray)) return null
    const kind: ItemKind | undefined = arrayKinds(refArray, current).kinds[index]
    if (!kind || kind === 'same') return null
    const tone: Tone = kind === 'added' ? 'added' : kind === 'moved' ? 'moved' : claim
    const word = tone === 'differs' ? 'Differs from base' : TONE[tone].word
    const before =
      kind === 'added'
        ? undefined
        : (refArray.find((i) =>
            typeof last === 'number'
              ? false
              : (i as {_key?: string})?._key === (last as {_key: string})._key,
          ) ?? refArray[index])
    return {tone, word, before}
  }
  const hit = pick(data.published, 'changed') ?? pick(data.base, 'differs')
  if (!hit) return null
  return {
    tone: hit.tone,
    label: hit.word,
    title: `${hit.word}: ${describe(value)}`,
    header: false,
    claims: [
      {
        kind: hit.tone === 'differs' ? 'differs' : 'changed',
        count: 1,
        tally: {added: 0, removed: 0, changed: 0, moved: 0},
      },
    ],
    before: hit.before,
    after: value,
    path,
    docId: data.baseId,
  }
}

function MarkedItem(props: ItemProps & {peek: boolean}) {
  const {peek, ...itemProps} = props
  const data = useMarkData()
  const spec = itemSpec(data, asPath(itemProps.path), itemProps.value as Json)
  return (
    <Marked peek={peek} spec={spec}>
      {itemProps.renderDefault(itemProps)}
    </Marked>
  )
}

export function E9Item(props: ItemProps) {
  const option = useOption('fieldMarks')
  if (option === 'a') return props.renderDefault(props)
  return <MarkedItem {...props} peek={option === 'c'} />
}

// ---- Portable text blocks --------------------------------------------------------------------------------------------

function MarkedBlock(props: BlockProps & {peek: boolean}) {
  const {peek, ...blockProps} = props
  const data = useMarkData()
  const spec = itemSpec(data, asPath(blockProps.path), blockProps.value as Json)
  return (
    <Marked peek={peek} spec={spec}>
      {blockProps.renderDefault(blockProps)}
    </Marked>
  )
}

export function E9Block(props: BlockProps) {
  const option = useOption('fieldMarks')
  // The C9 candidate keeps its own block mark while the E9 switch is A.
  if (option === 'a') return <BlockWithMark {...props} />
  return <MarkedBlock {...props} peek={option === 'c'} />
}

// ---- The document root: styles and the unknown-path mark ------------------------------------------------------------

function UnknownPaths(props: {names: string[]}) {
  return (
    <Card data-testid="e9-unknown-note" marginTop={3} padding={3} radius={2} tone="caution">
      <Flex align="flex-start" gap={2}>
        <span
          aria-hidden="true"
          style={{
            background: TONE.diverged.bar,
            borderRadius: 2,
            flex: 'none',
            height: 16,
            marginTop: 2,
            width: 3,
          }}
        />
        <Stack gap={2}>
          <Text size={1} weight="semibold">
            Unknown field{props.names.length > 1 ? 's' : ''}: {props.names.join(', ')}
          </Text>
          <Text muted size={1}>
            The document holds {props.names.length > 1 ? 'values' : 'a value'} the schema does not
            define, so the form cannot show
            {props.names.length > 1 ? ' them' : ' it'}.
          </Text>
        </Stack>
      </Flex>
    </Card>
  )
}

function RootMarks(props: InputProps) {
  const schema = useSchema()
  const data = useMarkData()
  const type = (data.current as {_type?: string} | null)?._type
  const known = type
    ? ((schema.get(type) as {fields?: {name: string}[]} | undefined)?.fields ?? []).map(
        (f) => f.name,
      )
    : []
  const unknown = type && known.length ? unknownKeys(data.current, known) : []
  return (
    <>
      <style data-testid="e9-mark-styles">{BAR_CSS}</style>
      {props.renderDefault(props)}
      {unknown.length ? <UnknownPaths names={unknown} /> : null}
    </>
  )
}

export function E9Input(props: InputProps) {
  const option = useOption('fieldMarks')
  if (option === 'a' || props.path.length > 0) return props.renderDefault(props)
  return <RootMarks {...props} />
}

// ---- Field sets (a small core seam: FieldSetRollupProvider) -----------------------------------------------------------

/** The roll-up of a COLLAPSED field set: its fields are not rendered, so no field mark can speak for them (F2-AC1). */
function FieldSetRollup(props: FieldSetRollupArgs) {
  const option = useOption('fieldMarks')
  const data = useMarkData()
  if (option === 'a' || !props.collapsed) return null
  let changed = 0
  let differs = 0
  for (const raw of props.fieldPaths) {
    const path = asPath(raw)
    const claims = claimsOf(
      get(data.published, path),
      get(data.base, path),
      get(data.current, path),
      data.published !== null,
      data.base !== null,
    )
    changed += claims.all.find((c) => c.kind === 'changed')?.count ?? 0
    differs += claims.all.find((c) => c.kind === 'differs')?.count ?? 0
  }
  const kind: Tone = changed > 0 ? 'changed' : 'differs'
  const count = changed > 0 ? changed : differs
  if (count === 0) return null
  const label = kind === 'changed' ? `${count} changed inside` : `${count} differ from base inside`
  return (
    <span
      data-kind={kind}
      data-testid="e9-fieldset-rollup"
      style={{
        alignItems: 'center',
        color: TONE[kind].fg,
        display: 'inline-flex',
        fontSize: 11,
        fontWeight: 600,
        gap: 6,
        whiteSpace: 'nowrap',
      }}
      title={label}
    >
      <span
        aria-hidden="true"
        style={{
          alignSelf: 'stretch',
          background: TONE[kind].bar,
          borderRadius: 2,
          minHeight: 14,
          width: 3,
        }}
      />
      {label}
    </span>
  )
}

/** The function the form calls to draw a field set's roll-up. */
export const renderFieldSetRollup = (args: FieldSetRollupArgs) => <FieldSetRollup {...args} />
