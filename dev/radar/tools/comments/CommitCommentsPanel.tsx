import {gitCommitId} from '@repo/utils/radar-ids'
import {Badge, Box, Button, Card, Checkbox, ErrorBoundary, Stack, Text} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {useCallback, useMemo, useRef, useState} from 'react'
import {
  type CommentBaseCreatePayload,
  CommentDeleteDialog,
  CommentInput,
  type CommentInputHandle,
  type CommentIntentGetter,
  type CommentMessage,
  type CommentReactionOption,
  COMMENTS_INSPECTOR_NAME,
  CommentsEnabledProvider,
  CommentsIntentProvider,
  CommentsList,
  CommentsProvider,
  type CommentStatus,
  type CommentThreadItem,
  type CommentUpdatePayload,
  type CurrentUser,
  hasCommentMessageValue,
  useAddonDataset,
  useComments,
  useCommentsEnabled,
  useCurrentUser,
  type UserListWithPermissionsHookValue,
} from 'sanity'
import {useRouter} from 'sanity/router'
import {Flex} from 'ui5'

const DOCUMENT_TYPE = 'gitCommit'
/**
 * The field the threads hang on. The studio has no document-level comments:
 * a thread needs a field path that resolves in the schema (an empty path
 * throws in `fromString`, an unknown field is dropped as invalid), so
 * `gitCommit` carries a value-less `findings` field for exactly this.
 */
const FIELD_PATH = 'findings'

/**
 * The studio's own comment threads on one commit, read and written through
 * the studio's comments machinery: `CommentsProvider` scoped to the commit's
 * `gitCommit` document, and `CommentsList` for the threads, replies, edits,
 * reactions, resolve and the composer with @mentions. Radar owns nothing about
 * how a comment is stored or notified — it only chooses the target document.
 *
 * Every thread hangs on the commit's `findings` field (see FIELD_PATH): a
 * finding about a commit is about the commit as a whole, and one field for all
 * of them keeps the threads in one group. The same threads show on that field
 * when the commit document is opened in the Structure tool.
 *
 * Notification emails for @mentions link to the commit document in the
 * Structure tool with the comments inspector open (`getCommentLink` and the
 * intent), since that is a place the studio router can always resolve.
 *
 * Renders nothing when comments are not enabled for the project or the
 * `gitCommit` type — the studio decides that, not this panel.
 */
export interface ChartScope {
  /** `TrendSeries.key` of the chart the panel sits on. */
  seriesKey: string
}

export function CommitCommentsPanel(props: {
  sha: string
  /** The commit subject — the "document title" in notification emails. */
  title?: string
  /**
   * On a chart: threads scoped to other charts are hidden, and new threads
   * can be pinned to this one. Absent (the bisect stepper): every thread on
   * the commit shows, and new threads are about the commit as a whole.
   */
  scope?: ChartScope
}) {
  const {sha, title, scope} = props
  const documentId = gitCommitId(sha)
  return (
    <CommentsEnabledProvider documentId={documentId} documentType={DOCUMENT_TYPE}>
      <EnabledGate documentId={documentId} title={title} scope={scope} />
    </CommentsEnabledProvider>
  )
}

function EnabledGate(props: {documentId: string; title?: string; scope?: ChartScope}) {
  const {documentId, title, scope} = props
  const {enabled} = useCommentsEnabled()
  const {resolveIntentLink} = useRouter()
  // The studio's provider builds thread items during render; if that ever
  // throws, React unwinds to the nearest boundary — without this one, the
  // whole tool. A failure on one commit costs that commit's panel, nothing else.
  const [failure, setFailure] = useState<Error | null>(null)

  const getCommentLink = useCallback(
    (commentId: string) =>
      `${window.location.origin}${resolveIntentLink('edit', {
        id: documentId,
        type: DOCUMENT_TYPE,
        inspect: COMMENTS_INSPECTOR_NAME,
        comment: commentId,
      })}`,
    [documentId, resolveIntentLink],
  )
  const getIntent = useCallback<CommentIntentGetter>(
    ({id, type}) => ({
      title: title ?? 'Commit',
      name: 'edit',
      params: {id, type, inspect: COMMENTS_INSPECTOR_NAME},
    }),
    [title],
  )

  if (!enabled) return null
  if (failure) {
    return <CommentsFailure failure={failure} onRetry={() => setFailure(null)} />
  }

  return (
    <ErrorBoundary onCatch={({error}) => setFailure(error)}>
      <CommentsIntentProvider getIntent={getIntent}>
        <CommentsProvider
          documentId={documentId}
          documentType={DOCUMENT_TYPE}
          type="field"
          sortOrder="desc"
          getCommentLink={getCommentLink}
        >
          <CommitCommentsList scope={scope} />
        </CommentsProvider>
      </CommentsIntentProvider>
    </ErrorBoundary>
  )
}

interface CommentToDelete {
  commentId: string
  isParent: boolean
}

/**
 * The way out when the studio's provider throws while building this commit's
 * threads: say so, and offer a retry that re-mounts it. The one such failure
 * met so far (a comment stored with an empty field path) is fixed at the
 * source in `buildCommentBreadcrumbs`, so this is the generic net, not a
 * repair tool — a failure on one commit must cost that commit's panel, never
 * the tool around it.
 */
function CommentsFailure(props: {failure: Error; onRetry: () => void}) {
  const {failure, onRetry} = props
  return (
    <Stack gap={3}>
      <Text size={1} weight="semibold">
        Comments
      </Text>
      <Card padding={3} radius={2} tone="caution">
        <Flex alignItems="center" gap={3}>
          <Box flex={1}>
            <Text size={1}>The comments on this commit could not be loaded: {failure.message}</Text>
          </Box>
          <Button mode="ghost" fontSize={1} text="Retry" onClick={onRetry} />
        </Flex>
      </Card>
    </Stack>
  )
}

const EMPTY_MESSAGE: CommentMessage = []

/**
 * Hides the thread group's header inside the studio's list. It names the
 * field the group hangs on — "Findings" — which is meaningful in a document
 * form and noise here, where every thread hangs on that one field. Hiding it
 * also puts this panel's scope checkbox right above the list's comment input,
 * where it reads as belonging to it. `CommentsList` exposes no prop for this;
 * the group `li` carries a stable data attribute (applyCommentsGroupAttr),
 * and the header is the first child of the layout inside it. If the studio
 * reshapes that DOM the header simply comes back — nothing breaks.
 *
 * The list's own padding goes too: the side inset is inspector-pane inset,
 * and here it pushed the thread cards in from the panel edge that everything
 * else (the header, the checkbox, this panel's composer) sits on; the top
 * inset (the list's, plus the group's own) opened a gap between the scope
 * checkbox and the comment box it belongs to.
 */
const LIST_CSS = `
.radar-commit-comments li[data-comments-group-id] > div > div:first-child { display: none; }
.radar-commit-comments ul { padding-left: 0; padding-right: 0; padding-top: 0; }
.radar-commit-comments li[data-comments-group-id] { padding-top: 0; }
`

/**
 * The composer for the first thread on a commit. `CommentsList` only offers
 * its new-thread input inside a group of existing threads — in the document
 * inspector the first comment on a field comes from the field's own comment
 * button — so a commit nobody has commented on would have no way in. This is
 * the studio's `CommentInput` (with @mentions), wired the way the list's own
 * `CreateNewThreadInput` is: Escape discards through the input's confirm
 * dialog when there is text, submit clears the draft.
 */
function NewThreadComposer(props: {
  currentUser: CurrentUser
  mentionOptions: UserListWithPermissionsHookValue
  readOnly: boolean
  onSubmit: (message: CommentMessage) => void
}) {
  const {currentUser, mentionOptions, readOnly, onSubmit} = props
  const [value, setValue] = useState<CommentMessage>(EMPTY_MESSAGE)
  const handle = useRef<CommentInputHandle | null>(null)
  const hasValue = hasCommentMessageValue(value)
  return (
    // Framed like the list's own thread cards. Always expanded (no
    // `expandOnFocus`): the input growing on focus moved everything under it
    // and made the panel jump while it was being read.
    <Card border radius={3} padding={3}>
      <CommentInput
        ref={handle}
        currentUser={currentUser}
        mentionOptions={mentionOptions}
        value={value}
        onChange={setValue}
        onSubmit={(next) => {
          onSubmit(next)
          setValue(EMPTY_MESSAGE)
        }}
        onKeyDown={(event) => {
          if (event.isDefaultPrevented() || event.key !== 'Escape') return
          // Keep Escape from also closing the run dialog; with a draft, ask
          // before throwing it away
          event.preventDefault()
          event.stopPropagation()
          if (hasValue) handle.current?.discardDialogController.open()
        }}
        onDiscardCancel={() => handle.current?.discardDialogController.close()}
        onDiscardConfirm={() => {
          setValue(EMPTY_MESSAGE)
          handle.current?.discardDialogController.close()
          handle.current?.focus()
        }}
        placeholder="Comment on this commit — @mention someone to notify them"
        readOnly={readOnly}
      />
    </Card>
  )
}

/**
 * The list wiring, a trimmed copy of the comments inspector's (the studio's
 * `CommentsInspector`): no field paths to select or scroll to, no onboarding
 * or upsell chrome, just the threads and the operations behind them.
 */
/**
 * Which chart a thread is about, read from where the composer stamped it.
 * The studio's create operation writes a fixed `context.payload`, so the
 * scope is patched onto the comment right after creation (see createThread);
 * the studio's store then echoes it back through its listener.
 */
function threadSeriesKey(item: CommentThreadItem): string | undefined {
  const value = item.parentComment.context?.payload?.seriesKey
  return typeof value === 'string' ? value : undefined
}

function CommitCommentsList(props: {scope?: ChartScope}) {
  const {scope} = props
  const currentUser = useCurrentUser()
  const {mode} = useCommentsEnabled()
  const {
    comments,
    getComment,
    getCommentLink,
    isCreatingDataset,
    mentionOptions,
    setStatus,
    status,
    operation,
  } = useComments()
  const {client: addonClient, createAddonDataset} = useAddonDataset()
  const toast = useToast()
  const [commentToDelete, setCommentToDelete] = useState<CommentToDelete | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<Error | null>(null)
  // Default to the chart the reader is looking at: a finding reached through
  // one metric's chart is usually about that metric. Ticking pins the thread
  // to the commit itself, so it shows on every chart.
  const [allCharts, setAllCharts] = useState(false)

  // On a chart, threads scoped to other charts are someone else's finding
  const belongsHere = useCallback(
    (item: CommentThreadItem) => {
      if (!scope) return true
      const key = threadSeriesKey(item)
      return key === undefined || key === scope.seriesKey
    },
    [scope],
  )
  const open = useMemo(
    () => comments.data.open.filter(belongsHere),
    [comments.data.open, belongsHere],
  )
  const resolved = useMemo(
    () => comments.data.resolved.filter(belongsHere),
    [comments.data.resolved, belongsHere],
  )
  const current = status === 'open' ? open : resolved
  const openCount = open.length
  const resolvedCount = resolved.length

  // Every new thread from this panel goes through here: the studio creates
  // it, then the chart scope is patched on when the reader kept "only on this
  // chart". A failed patch leaves the thread on every chart — visible, and
  // said so in a toast — rather than losing the comment.
  const createThread = useCallback(
    async (payload: CommentBaseCreatePayload) => {
      const id = payload.id ?? crypto.randomUUID()
      await operation.create({
        ...payload,
        id,
        type: 'field',
        fieldPath: payload.payload?.fieldPath || FIELD_PATH,
      })
      if (!scope || allCharts) return
      const notPinned = (err: unknown) =>
        toast.push({
          status: 'warning',
          title: 'Comment saved, but not pinned to this chart',
          description: err instanceof Error ? err.message : String(err),
        })
      // No try/catch: the React Compiler does not lower a throw inside one yet
      const client = addonClient ?? (await createAddonDataset().catch(() => null))
      if (!client) {
        notPinned(new Error('No comments dataset client'))
        return
      }
      await client
        .patch(id)
        .set({'context.payload.seriesKey': scope.seriesKey})
        .commit()
        .catch(notPinned)
    },
    [operation, scope, allCharts, addonClient, createAddonDataset, toast],
  )

  // From the list's own new-thread input (once threads exist on this chart)
  const handleNewThreadCreate = useCallback(
    (next: CommentBaseCreatePayload) => {
      void createThread({
        message: next.message,
        parentCommentId: next.parentCommentId,
        reactions: next.reactions,
        status: next.status,
        threadId: next.threadId,
        payload: next.payload,
      })
    },
    [createThread],
  )
  // From the composer below (the first thread on this chart) — one fresh thread id
  const handleComposerSubmit = useCallback(
    (message: CommentMessage) => {
      void createThread({
        message,
        parentCommentId: undefined,
        reactions: [],
        status: 'open',
        threadId: crypto.randomUUID(),
      })
    },
    [createThread],
  )
  const handleReply = useCallback(
    (next: CommentBaseCreatePayload) => {
      void operation.create({
        ...next,
        type: 'field',
        fieldPath: next.payload?.fieldPath || FIELD_PATH,
      })
    },
    [operation],
  )
  // Retrying a failed save goes through createThread too, so the retried
  // thread is pinned the way the reader asked (the failed optimistic document
  // never got its scope patched); the failed comment's own id is reused
  const handleCreateRetry = useCallback(
    (id: string) => {
      const comment = getComment(id)
      if (!comment) return
      void createThread({
        id: comment._id,
        message: comment.message,
        parentCommentId: comment.parentCommentId,
        reactions: comment.reactions ?? [],
        status: comment.status,
        threadId: comment.threadId,
        payload: {fieldPath: comment.target.path?.field || FIELD_PATH},
      })
    },
    [getComment, createThread],
  )
  const handleEdit = useCallback(
    (id: string, next: CommentUpdatePayload) => {
      void operation.update(id, next)
    },
    [operation],
  )
  const handleStatusChange = useCallback(
    (id: string, nextStatus: CommentStatus) => {
      void operation.update(id, {status: nextStatus})
      if (nextStatus === 'open') setStatus('open')
    },
    [operation, setStatus],
  )
  const handleReactionSelect = useCallback(
    (id: string, reaction: CommentReactionOption) => {
      void operation.react(id, reaction)
    },
    [operation],
  )
  const handleDeleteStart = useCallback(
    (id: string) => {
      const thread = current.find((item) => item.parentComment._id === id)
      setCommentToDelete({commentId: id, isParent: Boolean(thread && thread.replies.length > 0)})
      setDeleteError(null)
    },
    [current],
  )
  const closeDeleteDialog = useCallback(() => {
    if (deleteLoading) return
    setCommentToDelete(null)
  }, [deleteLoading])
  const handleDeleteConfirm = useCallback(
    async (id: string) => {
      setDeleteLoading(true)
      try {
        await operation.remove(id)
        setCommentToDelete(null)
      } catch (err) {
        setDeleteError(err instanceof Error ? err : new Error(String(err)))
      }
      setDeleteLoading(false)
    },
    [operation],
  )
  const handleCopyLink = useMemo(() => {
    if (!getCommentLink) return undefined
    return (id: string) => {
      navigator.clipboard.writeText(getCommentLink(id)).catch(() => {
        toast.push({status: 'error', title: 'Could not copy the link'})
      })
    }
  }, [getCommentLink, toast])

  if (!currentUser) return null

  return (
    <Stack gap={2}>
      {/* A little more room under the heading than the Stack's gap: the
          checkbox and the box under it are one group, the heading is not */}
      <Flex alignItems="center" gap={2} paddingBottom={1}>
        <Text size={1} weight="semibold">
          Comments
        </Text>
        {openCount > 0 && (
          <Badge fontSize={0} tone="default">
            {openCount}
          </Badge>
        )}
        <Box flex={1} />
        {/* Open / resolved, only once there is something resolved to look at —
            the toggle is noise on a commit nobody has commented on */}
        {resolvedCount > 0 && (
          <Flex gap={1}>
            <Button
              mode="bleed"
              fontSize={0}
              padding={2}
              text="Open"
              selected={status === 'open'}
              onClick={() => setStatus('open')}
            />
            <Button
              mode="bleed"
              fontSize={0}
              padding={2}
              text={`Resolved (${resolvedCount})`}
              selected={status === 'resolved'}
              onClick={() => setStatus('resolved')}
            />
          </Flex>
        )}
      </Flex>
      {/* Once threads exist, the list's own new-thread input (inside the
          thread group) is the way to start another; before that, this is */}
      {status === 'open' && !comments.loading && current.length === 0 && (
        <NewThreadComposer
          currentUser={currentUser}
          mentionOptions={mentionOptions}
          readOnly={isCreatingDataset || mode === 'upsell'}
          onSubmit={handleComposerSubmit}
        />
      )}
      {/* Where a new thread applies — right under this panel's comment box,
          and above the list (whose own new-thread input sits at its top); one
          control for both composers, since the list's has no room for it */}
      {scope &&
        status === 'open' && (
          // Flush with the panel edge, like the heading above and the thread
          // cards below — the one vertical line everything in the panel shares
          <Flex as="label" alignItems="center" gap={2} style={{cursor: 'pointer'}}>
            <Checkbox
              checked={allCharts}
              onChange={(event) => setAllCharts(event.currentTarget.checked)}
            />
            <Text size={0} muted>
              Comment on all charts
            </Text>
          </Flex>
        )}
      {/* CommentsList fills its parent and scrolls inside it, so it needs a
          bounded flex column to live in; the cap keeps a long thread from
          pushing the dialog off screen. Not rendered while empty: its blank
          state ("no open comments") would sit under the composer saying the
          obvious — and the inline flex display would beat a `hidden` attribute */}
      {(comments.loading || comments.error || current.length > 0) && (
        <Box
          className="radar-commit-comments"
          style={{display: 'flex', flexDirection: 'column', maxHeight: 420, minHeight: 0}}
        >
          <style dangerouslySetInnerHTML={{__html: LIST_CSS}} />
          <CommentsList
            comments={current}
            currentUser={currentUser}
            error={comments.error}
            loading={comments.loading}
            mentionOptions={mentionOptions}
            mode={mode ?? 'default'}
            onCopyLink={handleCopyLink}
            onCreateRetry={handleCreateRetry}
            onDelete={handleDeleteStart}
            onEdit={handleEdit}
            onNewThreadCreate={handleNewThreadCreate}
            onReactionSelect={handleReactionSelect}
            onReply={handleReply}
            onStatusChange={handleStatusChange}
            readOnly={isCreatingDataset}
            selectedPath={null}
            status={status}
          />
        </Box>
      )}
      {commentToDelete && (
        <CommentDeleteDialog
          {...commentToDelete}
          error={deleteError}
          loading={deleteLoading}
          onClose={closeDeleteDialog}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </Stack>
  )
}
