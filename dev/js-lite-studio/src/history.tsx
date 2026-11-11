/**
 * Document history, like the JS studio's history inspector: a timeline of the transactions that
 * touched the document, read from the history API, any revision of which the form can show and
 * restore, and the changes the edited document has against a base revision field by field (the
 * published document unless a revision is selected), each of which can be reverted. Same as the
 * Rust studio's `history.rs`.
 */
import {cleanupSemantic, DIFF_DELETE, DIFF_INSERT, makeDiff} from '@sanity/diff-match-patch'
import {AddIcon} from '@sanity/icons/Add'
import {ClockIcon} from '@sanity/icons/Clock'
import {CloseIcon} from '@sanity/icons/Close'
import {EditIcon} from '@sanity/icons/Edit'
import {PublishIcon} from '@sanity/icons/Publish'
import {RestoreIcon} from '@sanity/icons/Restore'
import {RevertIcon} from '@sanity/icons/Revert'
import {TrashIcon} from '@sanity/icons/Trash'
import {UnpublishIcon} from '@sanity/icons/Unpublish'
import {Avatar, Box, Button, Card, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {type ComponentType, useEffect, useState} from 'react'

import {initials} from './auth'
import {client, fetchText} from './client'
import {DATASET} from './config'
import {op} from './form/target'
import {currentUserId, useUser, userHue} from './presence'
import {schema, titleOf} from './schema'
import * as store from './store'
import {toastError} from './toasts'
import {draftId, isObject, type Json, type JsonObject, startCase, timeAgo, versionId} from './util'

const TIMELINE_LIMIT = 50
/** Edits by the same author closer together than this make one entry, like the JS timeline's edit
 * sessions. */
const SESSION_GAP_MS = 5 * 60 * 1000

export type EventKind = 'created' | 'edited' | 'published' | 'unpublished' | 'discarded' | 'deleted'

const KINDS: Record<EventKind, {label: string; icon: ComponentType; tone: string}> = {
  created: {label: 'Created', icon: AddIcon, tone: 'caution'},
  edited: {label: 'Edited', icon: EditIcon, tone: 'caution'},
  published: {label: 'Published', icon: PublishIcon, tone: 'positive'},
  unpublished: {label: 'Unpublished', icon: UnpublishIcon, tone: 'critical'},
  discarded: {label: 'Discarded draft', icon: RevertIcon, tone: 'caution'},
  deleted: {label: 'Deleted', icon: TrashIcon, tone: 'critical'},
}

export interface HistoryEvent {
  /** The last transaction of the entry, whose result the entry shows. */
  revision: string
  timestamp: string
  author: string
  kind: EventKind
  /** The document the entry's revision is read from. */
  documentId: string
}

/** A revision the form shows instead of the edited document. */
export interface Revision {
  event: HistoryEvent
  doc: JsonObject | null | undefined
}

/** Reads the timeline from transactions, newest first. `edited` is the draft, or the version in
 * a release, and `published` the published document. */
export function eventsOf(
  transactions: JsonObject[],
  edited: string,
  published: string,
): HistoryEvent[] {
  const events: HistoryEvent[] = []
  for (const tx of transactions) {
    const text = (key: string) => (typeof tx[key] === 'string' ? (tx[key] as string) : '')
    const mutations = (Array.isArray(tx.mutations) ? tx.mutations : []).flatMap((mutation) => {
      if (!isObject(mutation)) return []
      const [entry] = Object.entries(mutation)
      if (!entry) return []
      const [kind, body] = entry
      const id = isObject(body) ? (body.id ?? body._id) : undefined
      return typeof id === 'string' ? [[kind, id] as const] : []
    })
    const has = (id: string, kind?: string) =>
      mutations.some(
        ([mutation, target]) => target === id && (kind === undefined || kind === mutation),
      )
    const touchesEdited = has(edited)
    const touchesPublished = has(published)
    let kind: EventKind
    let documentId: string
    if (touchesEdited && touchesPublished) {
      ;[kind, documentId] = has(published, 'delete')
        ? ['unpublished', edited]
        : ['published', published]
    } else if (touchesPublished) {
      ;[kind, documentId] = has(published, 'delete')
        ? ['deleted', published]
        : ['edited', published]
    } else if (touchesEdited) {
      if (has(edited, 'delete')) [kind, documentId] = ['discarded', published]
      else if (has(edited, 'create')) [kind, documentId] = ['created', edited]
      else [kind, documentId] = ['edited', edited]
    } else {
      continue
    }
    const event: HistoryEvent = {
      revision: text('id'),
      timestamp: text('timestamp'),
      author: text('author'),
      kind,
      documentId,
    }
    // Newest first: an older edit by the same author shortly before joins the newer entry, which
    // keeps the revision it ends on.
    const last = events.at(-1)
    if (
      last &&
      last.kind === 'edited' &&
      kind === 'edited' &&
      last.author === event.author &&
      last.documentId === event.documentId &&
      Date.parse(last.timestamp) - Date.parse(event.timestamp) < SESSION_GAP_MS
    ) {
      continue
    }
    events.push(event)
  }
  return events
}

/** A changed top-level field of the document. */
export interface FieldChange {
  name: string
  title: string
  before: Json | undefined
  after: Json | undefined
}

/** The top-level fields that differ between `base` and `current`, in schema order, then any
 * other fields that differ. */
export function changesOf(
  typeName: string,
  base: JsonObject | null | undefined,
  current: JsonObject | null | undefined,
): FieldChange[] {
  const field = (doc: JsonObject | null | undefined, name: string) => {
    const value = doc?.[name]
    return value === null ? undefined : value
  }
  const names: [string, string][] = (schema().get(typeName)?.fields ?? []).map((def) => [
    def.name,
    titleOf(def),
  ])
  for (const doc of [base, current]) {
    for (const key of Object.keys(doc ?? {})) {
      if (!key.startsWith('_') && !names.some(([name]) => name === key))
        names.push([key, startCase(key)])
    }
  }
  return names.flatMap(([name, title]) => {
    const before = field(base, name)
    const after = field(current, name)
    return JSON.stringify(before) === JSON.stringify(after) ? [] : [{name, title, before, after}]
  })
}

/** The text a value reads as in a diff: strings as they are, Portable Text as its blocks' text. */
export function textOf(value: Json | undefined): string | undefined {
  if (value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'True' : 'False'
  if (Array.isArray(value) && value.every((item) => isObject(item) && item._type === 'block')) {
    return value
      .map((block) => {
        const children = isObject(block) && Array.isArray(block.children) ? block.children : []
        return children
          .map((child) => (isObject(child) && typeof child.text === 'string' ? child.text : ''))
          .join('')
      })
      .join('\n')
  }
  return undefined
}

export function summary(value: Json | undefined): string {
  if (value === undefined) return 'Empty'
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? '' : 's'}`
  if (isObject(value)) {
    if (typeof value._ref === 'string') return `Reference to ${value._ref}`
    const asset = isObject(value.asset) ? value.asset._ref : undefined
    if (typeof asset === 'string') return asset.split('-').slice(0, 2).join('-')
    const text = JSON.stringify(value)
    return text.length > 80 ? `${text.slice(0, 80)}…` : text
  }
  return textOf(value) ?? ''
}

/** An inline diff of two texts: removed text struck through on red, added text on green, like the
 * JS studio's string diff. */
function TextDiff(props: {before: string; after: string}) {
  const diffs = cleanupSemantic(makeDiff(props.before, props.after))
  return (
    <div style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>
      <Text size={1}>
        {diffs.map(([kind, text], index) => {
          if (kind === DIFF_DELETE) {
            return (
              <del
                key={index}
                data-diff="removed"
                style={{
                  backgroundColor: 'var(--card-badge-critical-bg-color)',
                  color: 'var(--card-badge-critical-fg-color)',
                  textDecoration: 'line-through',
                }}
              >
                {text}
              </del>
            )
          }
          if (kind === DIFF_INSERT) {
            return (
              <ins
                key={index}
                data-diff="added"
                style={{
                  backgroundColor: 'var(--card-badge-positive-bg-color)',
                  color: 'var(--card-badge-positive-fg-color)',
                  textDecoration: 'none',
                }}
              >
                {text}
              </ins>
            )
          }
          return <span key={index}>{text}</span>
        })}
      </Text>
    </div>
  )
}

function ChangeRow(props: {change: FieldChange; readOnly: boolean; onRevert: () => void}) {
  const {change} = props
  const before = textOf(change.before)
  const after = textOf(change.after)
  return (
    <Card border radius={2} padding={3} data-testid={`change-${change.name}`}>
      <Stack gap={3}>
        <Flex align="center" gap={2}>
          <Box flex={1}>
            <Text size={1} weight="medium">
              {change.title}
            </Text>
          </Box>
          <Button
            mode="bleed"
            tone="critical"
            fontSize={1}
            paddingX={2}
            paddingY={1}
            icon={RevertIcon}
            text="Revert"
            disabled={props.readOnly}
            onClick={props.onRevert}
          />
        </Flex>
        {before !== undefined && after !== undefined ? (
          <TextDiff before={before} after={after} />
        ) : (
          <Stack gap={2}>
            <div
              data-diff="removed"
              style={{textDecoration: 'line-through', color: 'var(--card-badge-critical-fg-color)'}}
            >
              <Text size={1}>{summary(change.before)}</Text>
            </div>
            <div data-diff="added" style={{color: 'var(--card-badge-positive-fg-color)'}}>
              <Text size={1}>{summary(change.after)}</Text>
            </div>
          </Stack>
        )}
      </Stack>
    </Card>
  )
}

async function loadTransactions(ids: string[]): Promise<JsonObject[]> {
  const text = await fetchText(
    `/data/history/${DATASET}/transactions/${ids.join(',')}`,
    {
      excludeContent: 'true',
      includeIdentifiedDocumentsOnly: 'true',
      reverse: 'true',
      limit: String(TIMELINE_LIMIT),
    },
    'history.transactions',
  )
  return text.split('\n').flatMap((line) => {
    if (!line.trim()) return []
    try {
      const value: unknown = JSON.parse(line)
      return isObject(value) ? [value] : []
    } catch {
      return []
    }
  })
}

/** The document `id` as the transaction `revision` left it. */
async function loadRevision(id: string, revision: string): Promise<JsonObject | undefined> {
  const response = await client().request<unknown>({
    url: `/data/history/${DATASET}/documents/${id}`,
    query: {revision},
    tag: 'history.revision',
  })
  const documents =
    isObject(response) && Array.isArray(response.documents) ? response.documents : []
  return isObject(documents[0]) ? documents[0] : undefined
}

function sameEvent(a: HistoryEvent | undefined, b: HistoryEvent): boolean {
  return (
    a !== undefined &&
    a.revision === b.revision &&
    a.documentId === b.documentId &&
    a.kind === b.kind
  )
}

function TimelineItem(props: {event: HistoryEvent; selected: boolean; onSelect: () => void}) {
  const {event} = props
  const user = useUser(event.author)
  const kind = KINDS[event.kind]
  const Icon = kind.icon
  return (
    <Card
      as="button"
      radius={2}
      padding={2}
      selected={props.selected}
      data-testid="timeline-item"
      onClick={props.onSelect}
    >
      <Flex align="center" gap={3}>
        <span
          style={{
            width: '1.5625rem',
            height: '1.5625rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 'none',
            backgroundColor: `var(--card-badge-${kind.tone}-bg-color)`,
            color: `var(--card-badge-${kind.tone}-icon-color)`,
          }}
        >
          <Text size={1}>
            <Icon />
          </Text>
        </span>
        <Stack gap={2} flex={1}>
          <Text size={1} weight="medium">
            {kind.label}
          </Text>
          <Text size={1} muted>
            {timeAgo(event.timestamp)}
          </Text>
        </Stack>
        {user ? (
          <Avatar
            src={user.image}
            initials={initials(user.name)}
            color={userHue(user.id, currentUserId())}
            size={0}
            title={user.name}
          />
        ) : null}
      </Flex>
    </Card>
  )
}

/** The history inspector of a document pane. */
export function HistoryInspector(props: {
  published: string
  typeName: string
  /** The release whose version the pane edits. */
  release: string | undefined
  /** The document the pane edits, without a revision selected. */
  current: JsonObject | null | undefined
  viewing: Revision | undefined
  setViewing: (revision: Revision | undefined) => void
  readOnly: boolean
  onClose: () => void
}) {
  const {published, typeName, release, current, viewing, setViewing, readOnly, onClose} = props
  const [events, setEvents] = useState<{list: HistoryEvent[]} | {error: string} | undefined>(
    undefined,
  )

  // The timeline follows the document: a change reloads it once the edits have settled.
  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const edited = release ? versionId(release, published) : draftId(published)
    const load = () => {
      loadTransactions([edited, published]).then(
        (transactions) => {
          if (!cancelled) setEvents({list: eventsOf(transactions, edited, published)})
        },
        (error: unknown) => {
          if (!cancelled) setEvents({error: error instanceof Error ? error.message : String(error)})
        },
      )
    }
    const reload = () => {
      clearTimeout(timer)
      timer = setTimeout(load, 1500)
    }
    load()
    const unsubscribes = [store.subscribe(edited, reload), store.subscribe(published, reload)]
    return () => {
      cancelled = true
      clearTimeout(timer)
      for (const unsubscribe of unsubscribes) unsubscribe()
    }
  }, [published, release])

  const publishedDoc = store.useDocuments([published], () => store.local(published))
  const base = viewing ? viewing.doc : publishedDoc
  const changes = changesOf(typeName, base, current)

  const select = (event: HistoryEvent) => {
    if (sameEvent(viewing?.event, event)) {
      setViewing(undefined)
      return
    }
    loadRevision(event.documentId, event.revision).then(
      // A discarded draft reads as the published document it went back to.
      (doc) => setViewing({event, doc: doc ?? store.local(published)}),
      (error: unknown) => toastError('Could not load the revision', error),
    )
  }

  const revert = (change: FieldChange) => {
    store.edit(published, typeName, release, [
      change.before === undefined ? op.unset([change.name]) : op.set([change.name], change.before),
    ])
  }

  let timeline
  if (!events) {
    timeline = (
      <Flex justify="center" padding={4}>
        <Spinner muted />
      </Flex>
    )
  } else if ('error' in events) {
    timeline = (
      <Box padding={3}>
        <Text size={1} muted>
          {events.error}
        </Text>
      </Box>
    )
  } else if (events.list.length === 0) {
    timeline = (
      <Box padding={3}>
        <Text size={1} muted>
          No history yet
        </Text>
      </Box>
    )
  } else {
    timeline = events.list.map((event) => (
      <TimelineItem
        key={`${event.documentId}:${event.revision}:${event.kind}`}
        event={event}
        selected={sameEvent(viewing?.event, event)}
        onSelect={() => select(event)}
      />
    ))
  }

  return (
    <Flex direction="column" height="fill" data-testid="history-inspector">
      <Card borderBottom paddingX={3} paddingY={2} style={{flex: 'none'}}>
        <Flex align="center" gap={2}>
          <Box flex={1} paddingX={1}>
            <Text size={1} weight="semibold">
              History
            </Text>
          </Box>
          <Button mode="bleed" icon={CloseIcon} title="Close history" onClick={onClose} />
        </Flex>
      </Card>
      <Box flex={1} overflow="auto" style={{minHeight: 0}}>
        <Stack gap={1} padding={2}>
          {timeline}
        </Stack>
        <Card borderTop padding={3}>
          <Stack gap={3}>
            <Text size={1} weight="semibold">
              {viewing
                ? `Changes since ${timeAgo(viewing.event.timestamp)}`
                : 'Changes since published'}
            </Text>
            <Stack gap={2}>
              {changes.length === 0 ? (
                <Box padding={3}>
                  <Text size={1} muted>
                    No changes
                  </Text>
                </Box>
              ) : (
                changes.map((change) => (
                  <ChangeRow
                    key={change.name}
                    change={change}
                    readOnly={readOnly}
                    onRevert={() => revert(change)}
                  />
                ))
              )}
            </Stack>
          </Stack>
        </Card>
      </Box>
    </Flex>
  )
}

/** The banner over a form that shows a revision, with the button that restores it. */
export function RevisionBanner(props: {
  viewing: Revision
  onBack: () => void
  onRestore: (doc: JsonObject) => void
}) {
  const {viewing} = props
  const user = useUser(viewing.event.author)
  const {doc} = viewing
  return (
    <Card
      tone="caution"
      paddingX={3}
      paddingY={2}
      borderBottom
      style={{flex: 'none'}}
      data-testid="revision-banner"
    >
      <Flex align="center" gap={3}>
        <Text size={1}>
          <ClockIcon />
        </Text>
        <Box flex={1}>
          <Text size={1}>
            {KINDS[viewing.event.kind].label} {timeAgo(viewing.event.timestamp)}
            {user ? ` by ${user.name}` : ''}
          </Text>
        </Box>
        <Button mode="bleed" text="Back to current" onClick={props.onBack} />
        <Button
          tone="caution"
          icon={RestoreIcon}
          text="Restore"
          data-testid="restore-revision"
          disabled={!doc}
          onClick={() => {
            if (doc) props.onRestore(doc)
          }}
        />
      </Flex>
    </Card>
  )
}
