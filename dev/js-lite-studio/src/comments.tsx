/**
 * Field comments, stored the way the JS studio's comments plugin stores them: `comment` documents
 * in the dataset's add-on dataset (`test-cmts` for `test`) whose target is a weak cross-dataset
 * reference to the published id, scoped to a release by `documentVersionId`. A thread is a parent
 * comment plus the replies with its `threadId`, and resolving a thread sets `status` on all of
 * them, so threads started in any of the studios show in the others. Same as the Rust studio's
 * `comments.rs`.
 */
import {type SanityClient} from '@sanity/client'
import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {CloseIcon} from '@sanity/icons/Close'
import {CommentIcon} from '@sanity/icons/Comment'
import {RestoreIcon} from '@sanity/icons/Restore'
import {TrashIcon} from '@sanity/icons/Trash'
import {Avatar, Box, Button, Card, Flex, Spinner, Stack, Text, TextArea} from '@sanity/ui'
import {createContext, type KeyboardEvent, use, useEffect, useState} from 'react'

import {initials} from './auth'
import {client} from './client'
import {DATASET, PROJECT_ID, WORKSPACE, WORKSPACE_TITLE} from './config'
import {currentUserId, useUser, userHue} from './presence'
import {schema, titleOf, type TypeDef} from './schema'
import {toastError} from './toasts'
import {
  isObject,
  type Json,
  type JsonObject,
  nowIso,
  randomKey,
  startCase,
  timeAgo,
  uuid,
} from './util'

const PROJECTION =
  '{_id, _createdAt, authorId, message, threadId, parentCommentId, status, lastEditedAt, "field": target.path.field, "version": target.documentVersionId}'
const QUERY = '*[_type == "comment" && target.document._ref == $id]'

export interface Comment {
  id: string
  createdAt: string
  authorId: string
  text: string
  threadId: string
  parentId: string | undefined
  status: string
  field: string
  version: string | undefined
}

/** A thread: its first comment, then the replies, oldest first. */
export interface Thread {
  id: string
  field: string
  status: string
  comments: Comment[]
}

/** The text of a comment message, mentions read as `@user`. */
export function messageText(message: unknown): string {
  if (!Array.isArray(message)) return ''
  return message
    .map((block) => {
      const children = isObject(block) && Array.isArray(block.children) ? block.children : []
      return children
        .map((child) => {
          if (!isObject(child)) return ''
          if (child._type === 'mention')
            return `@${typeof child.userId === 'string' ? child.userId : 'user'}`
          return typeof child.text === 'string' ? child.text : ''
        })
        .join('')
    })
    .join('\n')
}

/** A comment message: one Portable Text block per line. */
export function message(text: string): Json {
  return text
    .trim()
    .split('\n')
    .map((line) => ({
      _type: 'block',
      _key: randomKey(12),
      style: 'normal',
      markDefs: [],
      children: [{_type: 'span', _key: randomKey(12), text: line, marks: []}],
    }))
}

function commentFromJson(value: unknown): Comment | undefined {
  if (!isObject(value)) return undefined
  const text = (input: unknown) => (typeof input === 'string' && input !== '' ? input : undefined)
  const id = text(value._id)
  const threadId = text(value.threadId)
  if (!id || !threadId) return undefined
  // Projected by `PROJECTION`, or read from the whole document a listener event carries.
  const target = isObject(value.target) ? value.target : undefined
  const targetPath = target && isObject(target.path) ? target.path : undefined
  return {
    id,
    createdAt: text(value._createdAt) ?? '',
    authorId: text(value.authorId) ?? '',
    text: messageText(value.message),
    threadId,
    parentId: text(value.parentCommentId),
    status: text(value.status) ?? 'open',
    field: text(value.field) ?? text(targetPath?.field) ?? '',
    version: text(value.version) ?? text(target?.documentVersionId),
  }
}

/** Groups comments into threads, newest thread first, keeping those of `release` (or of the
 * draft when there is none). */
export function threadsOf(comments: Comment[], release: string | undefined): Thread[] {
  const threads: Thread[] = []
  const sorted = comments
    .filter((comment) => comment.version === release)
    .toSorted((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0))
  for (const comment of sorted) {
    const thread = threads.find((candidate) => candidate.id === comment.threadId)
    if (thread) thread.comments.push(comment)
    else
      threads.push({
        id: comment.threadId,
        field: comment.field,
        status: comment.status,
        comments: [comment],
      })
  }
  // A thread starts with its parent; its status is the parent's.
  for (const thread of threads) {
    thread.comments = thread.comments.toSorted(
      (a, b) => Number(a.parentId !== undefined) - Number(b.parentId !== undefined),
    )
    const parent = thread.comments[0]
    if (parent) {
      thread.status = parent.status
      thread.field = parent.field
    }
  }
  return threads.toReversed()
}

let addonName: string | undefined

/** A client for the add-on dataset, which the first comment on a dataset without one sets up. */
async function addonClient(setup: boolean): Promise<SanityClient | undefined> {
  const base = client()
  const forName = (name: string) => base.withConfig({dataset: name, useCdn: false})
  if (addonName) return forName(addonName)
  const find = async () => {
    const datasets = await base.request<unknown>({
      url: `/projects/${PROJECT_ID}/datasets`,
      query: {datasetProfile: 'comments', addonFor: DATASET},
      tag: 'comments.addon-dataset',
    })
    const first = Array.isArray(datasets) ? datasets[0] : undefined
    return isObject(first) && typeof first.name === 'string' ? first.name : undefined
  }
  let name = await find()
  if (!name && setup) {
    try {
      const response = await base.request<unknown>({
        url: `/comments/${DATASET}/setup`,
        method: 'POST',
      })
      name =
        isObject(response) && typeof response.datasetName === 'string'
          ? response.datasetName
          : undefined
    } catch (error) {
      // Another studio set it up first.
      name = await find()
      if (!name) throw error
    }
  }
  if (name) addonName = name
  return name ? forName(name) : undefined
}

function retriable(error: unknown): boolean {
  const status =
    isObject(error) && typeof error.statusCode === 'number' ? error.statusCode : undefined
  return status === undefined || status === 429 || status >= 500
}

/** Commits comment mutations, retrying when the request failed in a way a later attempt may not.
 * The transaction id stays the same, so an attempt that did land is not applied twice. */
async function commit(mutations: JsonObject[], tag: string): Promise<void> {
  const addon = await addonClient(true)
  if (!addon) throw new Error('The comments dataset could not be set up')
  const transactionId = uuid()
  for (let attempt = 0; ; attempt++) {
    try {
      await addon.mutate(mutations as never, {
        transactionId,
        visibility: 'async',
        returnDocuments: false,
        tag,
      })
      return
    } catch (error) {
      const status =
        isObject(error) && typeof error.statusCode === 'number' ? error.statusCode : undefined
      // The retried transaction already landed.
      if (attempt > 0 && status === 409) return
      if (!retriable(error) || attempt >= 3) throw error
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt))
    }
  }
}

export interface Comments {
  threads: Thread[]
  /** `undefined` while loading. */
  loaded: {error?: string} | undefined
  /** The field the inspector composes a new thread for. */
  field: string | undefined
  setField: (field: string | undefined) => void
  openInspector: (field?: string) => void
  post: (field: string, text: string, thread?: Thread) => void
  setStatus: (thread: Thread, status: 'open' | 'resolved') => void
  remove: (thread: Thread, comment: Comment) => void
  fieldTitle: (field: string) => string
}

export const CommentsContext = createContext<Comments | null>(null)

/** Loads the comments of `published` and keeps them current while the pane lives. */
export function useCommentsState(options: {
  published: string
  typeName: string
  release: string | undefined
  doc: JsonObject | null | undefined
  onOpen: () => void
}): Comments {
  const {published, typeName, release, doc, onOpen} = options
  const [list, setList] = useState<Comment[]>([])
  const [loaded, setLoaded] = useState<{error?: string} | undefined>(undefined)
  const [field, setField] = useState<string | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    let unsubscribe: (() => void) | undefined
    void (async () => {
      let addon: SanityClient | undefined
      try {
        addon = await addonClient(false)
      } catch (error) {
        if (!cancelled) setLoaded({error: error instanceof Error ? error.message : String(error)})
        return
      }
      if (cancelled) return
      if (!addon) {
        setLoaded({})
        return
      }
      const load = (from: SanityClient) => {
        from
          .fetch<unknown[]>(`${QUERY} ${PROJECTION}`, {id: published}, {tag: 'comments.list'})
          .then(
            (rows) => {
              if (cancelled) return
              setList(rows.flatMap((row) => commentFromJson(row) ?? []))
              setLoaded({})
            },
            (error: unknown) => {
              if (!cancelled)
                setLoaded({error: error instanceof Error ? error.message : String(error)})
            },
          )
      }
      // Like the JS comments store: the list is fetched when the listener connects, then kept
      // current from the documents its events carry. Querying again after an event can return
      // the list from before it.
      const subscription = addon
        .listen(QUERY, {id: published}, {
          includeResult: true,
          includeAllVersions: true,
          events: ['welcome', 'mutation'],
          tag: 'comments.listen',
        } as never)
        .subscribe({
          next: (event: {type: string; documentId?: string; result?: unknown}) => {
            if (event.type === 'welcome') {
              load(addon)
              return
            }
            if (event.type !== 'mutation') return
            const comment = commentFromJson(event.result)
            setList((current) => {
              const next = current.filter((item) => item.id !== event.documentId)
              return comment ? [...next, comment] : next
            })
          },
          error: () => undefined,
        })
      unsubscribe = () => subscription.unsubscribe()
    })()
    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [published])

  const threads = threadsOf(list, release)

  return {
    threads,
    loaded,
    field,
    setField,
    openInspector: (next?: string) => {
      setField(next)
      onOpen()
    },
    post: (path, text, thread) => {
      const author = currentUserId()
      if (!author) return
      const id = uuid()
      const threadId = thread?.id ?? uuid()
      const parentId = thread?.comments[0]?.id
      const length = thread ? thread.comments.length + 1 : 1
      const title = typeof doc?.title === 'string' ? doc.title.slice(0, 120) : ''
      const revision = typeof doc?._rev === 'string' ? doc._rev : ''
      const url = `${window.location.origin}/${WORKSPACE}/intent/edit/id=${published};type=${typeName};path=${encodeURIComponent(path)}/?comment=${id}`
      const target: JsonObject = {
        documentRevisionId: revision,
        path: {field: path},
        document: {
          _dataset: DATASET,
          _projectId: PROJECT_ID,
          _ref: published,
          _type: 'crossDatasetReference',
          _weak: true,
        },
        documentType: typeName,
      }
      if (release) target.documentVersionId = release
      const status = thread?.status === 'resolved' ? 'resolved' : 'open'
      const created: JsonObject = {
        _id: id,
        _type: 'comment',
        authorId: author,
        message: message(text),
        status,
        threadId,
        reactions: [],
        context: {
          payload: {workspace: WORKSPACE},
          notification: {
            currentThreadLength: length,
            documentTitle: title,
            url,
            workspaceTitle: WORKSPACE_TITLE,
            workspaceName: WORKSPACE,
          },
          tool: 'structure',
        },
        target,
      }
      if (parentId) created.parentCommentId = parentId
      const optimistic: Comment = {
        id,
        createdAt: nowIso(),
        authorId: author,
        text: text.trim(),
        threadId,
        parentId,
        status,
        field: path,
        version: release,
      }
      setList((current) => [...current, optimistic])
      commit([{create: created}], 'comments.create').catch((error: unknown) => {
        setList((current) => current.filter((comment) => comment.id !== id))
        toastError('Could not post the comment', error)
      })
    },
    setStatus: (thread, status) => {
      const ids = new Set(thread.comments.map((comment) => comment.id))
      const previous = thread.status
      setList((current) =>
        current.map((comment) => (ids.has(comment.id) ? {...comment, status} : comment)),
      )
      commit(
        [...ids].map((id) => ({patch: {id, set: {status}}})),
        'comments.status',
      ).catch((error: unknown) => {
        setList((current) =>
          current.map((comment) =>
            ids.has(comment.id) ? {...comment, status: previous} : comment,
          ),
        )
        toastError('Could not update the thread', error)
      })
    },
    remove: (thread, comment) => {
      const ids = new Set(
        comment.parentId === undefined ? thread.comments.map((item) => item.id) : [comment.id],
      )
      const removed = thread.comments.filter((item) => ids.has(item.id))
      setList((current) => current.filter((item) => !ids.has(item.id)))
      commit(
        [...ids].map((id) => ({delete: {id}})),
        'comments.delete',
      ).catch((error: unknown) => {
        setList((current) => [
          ...current,
          ...removed.filter((item) => !current.some((c) => c.id === item.id)),
        ])
        toastError('Could not delete the comment', error)
      })
    },
    fieldTitle: (path) => fieldTitle(typeName, path),
  }
}

/** The title of a commented field: the schema titles of its path. */
function fieldTitle(typeName: string, path: string): string {
  const current = schema()
  const parts: string[] = []
  let fields: TypeDef[] = current.get(typeName)?.fields ?? []
  for (const segment of path.split('.')) {
    const name = segment.split('[')[0]
    if (!name) continue
    const def = fields.find((candidate) => candidate.name === name)
    if (def) {
      parts.push(titleOf(def))
      fields = current.resolve(def).fields
    } else {
      parts.push(startCase(name))
      fields = []
    }
  }
  return parts.join(' / ')
}

/** Scrolls the form to the field of `path` and focuses its first input. */
function revealField(path: string) {
  const element = document.querySelector(`[data-path="${CSS.escape(path)}"]`)
  if (!element) return
  element.scrollIntoView({block: 'nearest'})
  const input = element.querySelector<HTMLElement>('input, textarea, [contenteditable="true"]')
  input?.focus()
}

/** The comment button in a field's header, with the number of open threads on the field. */
export function FieldCommentButton(props: {path: string}) {
  const comments = use(CommentsContext)
  if (!comments) return null
  const count = comments.threads.filter(
    (thread) => thread.field === props.path && thread.status === 'open',
  ).length
  const title =
    count === 0
      ? 'Add comment'
      : count === 1
        ? '1 open comment thread'
        : `${count} open comment threads`
  return (
    <button
      type="button"
      data-testid={`comment-button-${props.path}`}
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        border: 0,
        background: 'none',
        cursor: 'pointer',
        padding: '2px 4px',
        borderRadius: 3,
        font: 'inherit',
        color: count > 0 ? 'var(--card-badge-primary-fg-color)' : 'var(--card-muted-fg-color)',
        opacity: count > 0 ? 1 : 0.6,
      }}
      onClick={() => comments.openInspector(props.path)}
    >
      <Text size={1}>
        <CommentIcon />
      </Text>
      {count > 0 ? (
        <Text size={1} weight="medium">
          {count}
        </Text>
      ) : null}
    </button>
  )
}

function CommentItem(props: {comment: Comment; thread: Thread; comments: Comments}) {
  const {comment, thread, comments} = props
  const user = useUser(comment.authorId)
  const own = currentUserId() === comment.authorId
  const isParent = comment.parentId === undefined
  const resolved = thread.status === 'resolved'
  return (
    <Stack gap={2} data-testid="comment">
      <Flex align="center" gap={2}>
        <Avatar
          src={user?.image}
          initials={user ? initials(user.name) : undefined}
          color={userHue(comment.authorId, currentUserId())}
          size={0}
          title={user?.name}
        />
        <Flex flex={1} gap={2} align="center" style={{minWidth: 0}}>
          <Box style={{minWidth: 0}}>
            <Text size={1} weight="semibold" textOverflow="ellipsis">
              {user?.name ?? 'Loading…'}
            </Text>
          </Box>
          <div style={{flex: 'none', whiteSpace: 'nowrap'}}>
            <Text size={0} muted>
              {timeAgo(comment.createdAt)}
            </Text>
          </div>
        </Flex>
        {isParent ? (
          <Button
            mode="bleed"
            padding={1}
            fontSize={1}
            icon={resolved ? RestoreIcon : CheckmarkCircleIcon}
            title={resolved ? 'Reopen thread' : 'Mark as resolved'}
            data-testid={resolved ? 'reopen-thread' : 'resolve-thread'}
            onClick={() => comments.setStatus(thread, resolved ? 'open' : 'resolved')}
          />
        ) : null}
        {own ? (
          <Button
            mode="bleed"
            tone="critical"
            padding={1}
            fontSize={1}
            icon={TrashIcon}
            title="Delete comment"
            onClick={() => comments.remove(thread, comment)}
          />
        ) : null}
      </Flex>
      <div style={{paddingLeft: '2rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>
        <Text size={1}>{comment.text}</Text>
      </div>
    </Stack>
  )
}

function Composer(props: {
  placeholder: string
  button: string
  autoFocus?: boolean
  onPost: (text: string) => void
}) {
  const [text, setText] = useState('')
  const post = () => {
    if (!text.trim()) return
    props.onPost(text)
    setText('')
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      post()
    }
  }
  return (
    <Stack gap={2}>
      <div onKeyDown={onKeyDown} data-testid="comment-input">
        <TextArea
          value={text}
          onChange={(event) => setText(event.currentTarget.value)}
          placeholder={props.placeholder}
          rows={2}
          fontSize={1}
          autoFocus={props.autoFocus}
        />
      </div>
      <Flex justify="flex-end">
        <Button
          tone="primary"
          fontSize={1}
          paddingX={3}
          paddingY={2}
          text={props.button}
          data-testid="post-comment"
          disabled={!text.trim()}
          onClick={post}
        />
      </Flex>
    </Stack>
  )
}

/** The comments inspector of a document pane: the threads of the document, open or resolved, and
 * a composer for a new thread on the field whose comment button was clicked. */
export function CommentsInspector(props: {comments: Comments; onClose: () => void}) {
  const {comments, onClose} = props
  const [tab, setTab] = useState<'open' | 'resolved'>('open')
  const {field} = comments

  let list
  if (comments.loaded?.error) {
    list = (
      <Box padding={3}>
        <Text size={1} muted>
          Comments are unavailable: {comments.loaded.error}
        </Text>
      </Box>
    )
  } else if (!comments.loaded) {
    list = (
      <Flex justify="center" padding={4}>
        <Spinner muted />
      </Flex>
    )
  } else {
    const threads = comments.threads.filter((thread) => thread.status === tab)
    list =
      threads.length === 0 ? (
        <Box padding={3}>
          <Text size={1} muted>
            {tab === 'open'
              ? 'No open comments yet. Use the comment button next to a field to start a thread.'
              : 'No resolved comments.'}
          </Text>
        </Box>
      ) : (
        threads.map((thread) => (
          <Card
            key={thread.id}
            border
            radius={2}
            padding={3}
            data-testid="comment-thread"
            data-thread-field={thread.field}
          >
            <Stack gap={3}>
              <button
                type="button"
                title="Go to field"
                style={{
                  border: 0,
                  background: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  textAlign: 'left',
                  font: 'inherit',
                  color: 'inherit',
                }}
                onClick={() => revealField(thread.field)}
              >
                <Text size={1} muted weight="medium">
                  {comments.fieldTitle(thread.field)}
                </Text>
              </button>
              {thread.comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  thread={thread}
                  comments={comments}
                />
              ))}
              {thread.status === 'resolved' ? null : (
                <Composer
                  placeholder="Reply…"
                  button="Reply"
                  onPost={(text) => comments.post(thread.field, text, thread)}
                />
              )}
            </Stack>
          </Card>
        ))
      )
  }

  const tabButton = (value: 'open' | 'resolved', label: string) => (
    <Button
      mode="bleed"
      fontSize={1}
      paddingX={2}
      paddingY={1}
      text={label}
      selected={tab === value}
      data-testid={`comments-tab-${value}`}
      onClick={() => setTab(value)}
    />
  )

  return (
    <Flex direction="column" height="fill" data-testid="comments-inspector">
      <Card borderBottom paddingX={3} paddingY={2} style={{flex: 'none'}}>
        <Flex align="center" gap={2}>
          <Box flex={1} paddingX={1}>
            <Text size={1} weight="semibold">
              Comments
            </Text>
          </Box>
          {tabButton('open', 'Open')}
          {tabButton('resolved', 'Resolved')}
          <Button mode="bleed" icon={CloseIcon} title="Close comments" onClick={onClose} />
        </Flex>
      </Card>
      <Box flex={1} overflow="auto" style={{minHeight: 0}}>
        <Stack gap={2} padding={2}>
          {field !== undefined ? (
            <Card border radius={2} padding={3} data-testid="new-thread">
              <Stack gap={3}>
                <Flex align="center" gap={2}>
                  <Box flex={1}>
                    <Text size={1} weight="medium">
                      New comment on {comments.fieldTitle(field)}
                    </Text>
                  </Box>
                  <Button
                    mode="bleed"
                    padding={1}
                    fontSize={1}
                    icon={CloseIcon}
                    title="Cancel"
                    onClick={() => comments.setField(undefined)}
                  />
                </Flex>
                <Composer
                  key={field}
                  placeholder="Add a comment…"
                  button="Comment"
                  autoFocus
                  onPost={(text) => {
                    comments.post(field, text, undefined)
                    comments.setField(undefined)
                    setTab('open')
                  }}
                />
              </Stack>
            </Card>
          ) : null}
          {list}
        </Stack>
      </Box>
    </Flex>
  )
}
