import {type PortableTextBlock} from '@sanity/types'
import {Avatar, AvatarStack, Badge, Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ReactNode, useCallback, useState} from 'react'
import {css, styled} from 'styled-components'

import {CommentsList} from '../../../../packages/sanity/src/core/comments/components/list/CommentsList'
import {CommentsFieldButton} from '../../../../packages/sanity/src/core/comments/plugin/field/CommentsFieldButton'
import {
  type CommentBaseCreatePayload,
  type CommentDocument,
  type CommentReactionOption,
  type CommentStatus,
  type CommentThreadItem,
  type CommentUpdatePayload,
} from '../../../../packages/sanity/src/core/comments/types'
import {
  createFixtureComment,
  createUserServingClient,
  currentUserDoug,
  fixtureMentionOptions,
  fixtureOpenThreads,
  fixtureResolvedThreads,
  fixtureUsers,
} from '../../lib/mockCollabFixtures'
import {WithStudioProviders} from '../../lib/testProvider'

const meta: Meta = {
  title: 'Collaboration/Comments',
  parameters: {
    // Every story drives its own fixed fixture through CommentsListDemo or the audit-pair
    // render functions; no component prop type at meta level to control.
    controls: {include: []},
    docs: {
      description: {
        component: [
          'Comments is the surface where document conversation lives: threads pinned to the ' +
            'fields they discuss, each one repliable, resolvable and reactable.',
          '',
          '|        |                                                                                                                                                                                                                                                                                                                                                                                                              |',
          '| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |',
          '| Source | `packages/sanity/src/core/comments/`. Studio-only, no DS equivalent                                                                                                                                                                                                                                                                                                                                          |',
          '| Tier   | SERVICE. The collaboration layer riding on the document (inspector list, field seam, PTE composer); it decorates the core edit loop rather than being it, but couples deeply through fields and realtime                                                                                                                                                                                                     |',
          '| Audit  | 🔴 needs-work (`collaborative-presence`). The add-comment affordance on a field is hover-only (the field-actions floating card mounts at `opacity: 0` under `@media (hover: hover)`, `packages/sanity/src/core/form/components/formField/FormFieldBaseHeader.tsx:72-99`), and comment badges show totals, not presence: nothing tells you who else is here or where they are working before you open a panel |',
          '',
          'This is the comment-threads layer on a document: the inspector list of threads, the ' +
            'per-field add-comment button, and the reply, resolve, and react loop that rides on ' +
            'top. It decorates the core edit loop rather than being it, but it couples deeply, ' +
            'through the fields it attaches to and the realtime that keeps everyone in sync.',
          '',
          'The list stories mount the **real** `CommentsList` (the component the comments ' +
            'inspector renders) with fixture threads. The stateful demo wires every callback, ' +
            'reply, edit, delete, resolve/reopen, reactions, to a local copy of the fixtures, so ' +
            'the full interaction surface works: replies land in the thread, resolving removes a ' +
            'thread from the open view, reactions toggle. Avatars and mention rows resolve ' +
            'through the real `createUserStore` batching over a fixture-serving mock client ' +
            '(`lib/mockCollabFixtures.tsx`).',
          '',
          'Harness notes: the `comments` locale bundle is plugin-registered in a real Studio ' +
            'and is added to the shared harness i18next instance by the fixture module. ' +
            'Timestamps are offsets from load time, so relative labels ("2 hours ago") render ' +
            'identically on any day. Thread selection and scroll coordination (`onPathSelect` ' +
            'into the form) are inert here: there is no host document form.',
          '',
          '> **Why it matters:** both collaboration gaps the audit flagged are here to see. The ' +
            'add-comment affordance on a field is hover-only: it stays invisible until the ' +
            'pointer arrives, so nothing tells a touch user or a scanner that commenting exists. ' +
            'And the field badge shows a total, not presence: a count, never who else is in the ' +
            'thread or here right now. The Current and Recommended pair below walks both.',
        ].join('\n'),
      },
    },
  },
  decorators: [WithStudioProviders({client: createUserServingClient()})],
  tags: [
    'autodocs',
    'chapter:cms',
    'pattern:collaborative-presence',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/** Sized like the comments inspector pane so `height="fill"` and scrolling behave. */
function InspectorFrame(props: {children: ReactNode; height?: number}) {
  const {children, height = 460} = props
  return (
    <Box padding={3}>
      <Card border radius={3} style={{width: 360, height, overflow: 'hidden'}}>
        {children}
      </Card>
    </Box>
  )
}

let localCommentId = 0

interface CommentsListDemoProps {
  initial: CommentThreadItem[]
  status: CommentStatus
  loading?: boolean
  error?: Error | null
  readOnly?: boolean
}

/**
 * Stateful host for the real `CommentsList`: callbacks mutate a local copy of the
 * fixture threads, standing in for `useCommentOperations` + the comments store.
 */
function CommentsListDemo(props: CommentsListDemoProps) {
  const {initial, status, loading = false, error = null, readOnly} = props
  const [threads, setThreads] = useState<CommentThreadItem[]>(initial)

  const makeComment = useCallback(
    (payload: CommentBaseCreatePayload, fieldPath: string): CommentDocument =>
      createFixtureComment({
        id: `local-comment-${++localCommentId}`,
        authorId: currentUserDoug.id,
        message: payload.message ?? [],
        threadId: payload.threadId,
        fieldPath,
        createdAgoMs: 0,
        parentCommentId: payload.parentCommentId,
        status: payload.status,
      }),
    [],
  )

  const handleReply = useCallback(
    (payload: CommentBaseCreatePayload) => {
      setThreads((prev) =>
        prev.map((thread) =>
          thread.threadId === payload.threadId
            ? {
                ...thread,
                commentsCount: thread.commentsCount + 1,
                // Storage order is newest-first; CommentsList reverses per thread.
                replies: [makeComment(payload, thread.fieldPath), ...thread.replies],
              }
            : thread,
        ),
      )
    },
    [makeComment],
  )

  const handleNewThreadCreate = useCallback(
    (payload: CommentBaseCreatePayload) => {
      const fieldPath = payload.payload?.fieldPath ?? 'title'
      setThreads((prev) => [
        {
          breadcrumbs: [{invalid: false, title: fieldPath}],
          commentsCount: 1,
          fieldPath,
          hasReferencedValue: false,
          parentComment: makeComment(payload, fieldPath),
          replies: [],
          threadId: payload.threadId,
        },
        ...prev,
      ])
    },
    [makeComment],
  )

  const handleDelete = useCallback((id: string) => {
    setThreads((prev) =>
      prev
        .filter((thread) => thread.parentComment._id !== id)
        .map((thread) => ({
          ...thread,
          replies: thread.replies.filter((reply) => reply._id !== id),
        })),
    )
  }, [])

  const handleEdit = useCallback((id: string, payload: CommentUpdatePayload) => {
    const patch = (comment: CommentDocument): CommentDocument =>
      comment._id === id
        ? {
            ...comment,
            message: payload.message ?? comment.message,
            lastEditedAt: comment._createdAt,
          }
        : comment
    setThreads((prev) =>
      prev.map((thread) => ({
        ...thread,
        parentComment: patch(thread.parentComment),
        replies: thread.replies.map(patch),
      })),
    )
  }, [])

  /** Resolving (or reopening) removes the thread from the current status view. */
  const handleStatusChange = useCallback((id: string, _nextStatus: CommentStatus) => {
    setThreads((prev) => prev.filter((thread) => thread.parentComment._id !== id))
  }, [])

  const handleReactionSelect = useCallback((id: string, reaction: CommentReactionOption) => {
    const toggle = (comment: CommentDocument): CommentDocument => {
      if (comment._id !== id) return comment
      const reactions = comment.reactions ?? []
      const mine = reactions.find(
        (item) => item.userId === currentUserDoug.id && item.shortName === reaction.shortName,
      )
      return {
        ...comment,
        reactions: mine
          ? reactions.filter((item) => item !== mine)
          : [
              ...reactions,
              {
                _key: `local-reaction-${++localCommentId}`,
                shortName: reaction.shortName,
                userId: currentUserDoug.id,
                addedAt: new Date().toISOString(),
              },
            ],
      }
    }
    setThreads((prev) =>
      prev.map((thread) => ({
        ...thread,
        parentComment: toggle(thread.parentComment),
        replies: thread.replies.map(toggle),
      })),
    )
  }, [])

  return (
    <InspectorFrame>
      <CommentsList
        comments={threads}
        currentUser={currentUserDoug}
        error={error}
        loading={loading}
        mentionOptions={fixtureMentionOptions}
        mode="default"
        onCopyLink={() => undefined}
        onCreateRetry={() => undefined}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onNewThreadCreate={handleNewThreadCreate}
        onReactionSelect={handleReactionSelect}
        onReply={handleReply}
        onStatusChange={handleStatusChange}
        readOnly={readOnly}
        selectedPath={null}
        status={status}
      />
    </InspectorFrame>
  )
}

/**
 * Two open threads as the inspector shows them: breadcrumbs to the commented field, a
 * deep thread (two replies, a `@mention`, a reactions bar with stacked 👍) and a bare
 * one. Everything is live: reply inline, react, resolve from the context menu (the
 * thread leaves the open view), edit or delete your own comments (Doug's).
 */
export const OpenThreads: Story = {
  name: 'Thread list (open)',
  parameters: {docs: {story: {height: '560px'}}},
  render: () => <CommentsListDemo initial={fixtureOpenThreads} status="open" />,
}

/**
 * The resolved view: same list component with `status="resolved"`. The context menu
 * flips to "Re-open"; reopening removes the thread from this view.
 */
export const ResolvedThreads: Story = {
  name: 'Thread list (resolved)',
  parameters: {docs: {story: {height: '560px'}}},
  render: () => <CommentsListDemo initial={fixtureResolvedThreads} status="resolved" />,
}

/** The open-tab empty state ("No open comments yet"). */
export const EmptyOpen: Story = {
  name: 'Empty (open)',
  render: () => <CommentsListDemo initial={[]} status="open" />,
}

/** The resolved-tab empty state. */
export const EmptyResolved: Story = {
  name: 'Empty (resolved)',
  render: () => <CommentsListDemo initial={[]} status="resolved" />,
}

/** `loading`: the list defers to `CommentsListStatus`'s loading block. */
export const Loading: Story = {
  render: () => <CommentsListDemo initial={[]} status="open" loading />,
}

/** `error`: the terse failure state (no retry affordance: an audit-adjacent nit). */
export const ErrorState: Story = {
  name: 'Error',
  render: () => (
    <CommentsListDemo initial={[]} status="open" error={new Error('Failed to load comments')} />
  ),
}

// ---------------------------------------------------------------------------
// The audit pair: collaborative-presence
// ---------------------------------------------------------------------------

/**
 * Reproduction of the field-actions hover gate from
 * `FormFieldBaseHeader.tsx:72-99`: the floating card holding the comment button
 * mounts at `opacity: 0` under `@media (hover: hover)` and is revealed by row hover
 * or focus-within. (`data-has-comments` mirrors `shouldShowFloatingCard`, which
 * pins the card visible once a field HAS comments.)
 */
const HoverGate = styled.div(
  () => css`
    transition: opacity 150ms ease;

    @media (hover: hover) {
      opacity: 0;

      &:focus-within {
        opacity: 1;
      }

      [data-field-row]:hover & {
        opacity: 1;
      }

      &[data-has-comments='true'] {
        opacity: 1;
      }
    }
  `,
)

function FieldRow(props: {title: string; gate?: boolean; hasComments?: boolean; slot: ReactNode}) {
  const {title, gate = true, hasComments = false, slot} = props
  return (
    <Stack data-field-row="" gap={2}>
      <Flex align="center" gap={2} style={{minHeight: 25}}>
        <Box flex={1}>
          <Text size={1} weight="medium">
            {title}
          </Text>
        </Box>
        {gate ? (
          <HoverGate data-has-comments={hasComments ? 'true' : 'false'}>{slot}</HoverGate>
        ) : (
          <Box>{slot}</Box>
        )}
      </Flex>
      <Card border padding={3} radius={2} tone="transparent">
        <Text muted size={1}>
          {title} field value…
        </Text>
      </Card>
    </Stack>
  )
}

/** The real `CommentsFieldButton` with local open/value state. */
function FieldCommentButton(props: {count: number; fieldTitle: string}) {
  const {count, fieldTitle} = props
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState<PortableTextBlock[] | null>(null)
  return (
    <CommentsFieldButton
      count={count}
      currentUser={currentUserDoug}
      fieldTitle={fieldTitle}
      isCreatingDataset={false}
      mentionOptions={fixtureMentionOptions}
      onChange={setValue}
      onClick={() => setOpen((prev) => !prev)}
      onClose={() => setOpen(false)}
      onCommentAdd={() => setValue(null)}
      onDiscard={() => setValue(null)}
      open={open}
      value={value}
    />
  )
}

/**
 * **Current (audit finding).** Two field rows with the REAL `CommentsFieldButton` in a
 * faithful reproduction of the form's hover gate. "Title" has no comments: its
 * add-comment affordance is *invisible until you hover the row*, nothing advertises
 * that commenting exists. "Body" has comments, so its badge is pinned, but it reads
 * **"2"**: a total. Not who, not whether they are here now. The audit note: *"add-comment
 * is hover-only; badges show totals not presence."* (On the "Title" row, clicking the
 * revealed button opens the real compose popover.)
 */
export const CurrentPresence: Story = {
  name: 'Current (hover-only affordance, count-only badge)',
  tags: ['audit:needs-work'],
  parameters: {docs: {story: {height: '360px'}}},
  render: () => (
    <Box padding={4} style={{maxWidth: 480}}>
      <Stack gap={5}>
        <FieldRow title="Title" slot={<FieldCommentButton count={0} fieldTitle="Title" />} />
        <FieldRow
          title="Body"
          hasComments
          slot={<FieldCommentButton count={2} fieldTitle="Body" />}
        />
      </Stack>
    </Box>
  ),
}

const presenceUsers = fixtureUsers.filter((user) => user.id !== 'doug')

function nameInitials(displayName: string | undefined) {
  return (displayName ?? '')
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .filter((_, index, parts) => index === 0 || index === parts.length - 1)
    .join('')
    .toUpperCase()
}

/** Mocked presence-bearing badge: who is in the thread, who is here right now. */
function PresenceBadge(props: {activeUserIds: string[]; count: number}) {
  const {activeUserIds, count} = props
  return (
    <Card border padding={1} radius={6}>
      <Flex align="center" gap={2}>
        <AvatarStack maxLength={3} size={0}>
          {presenceUsers
            .filter((user) => activeUserIds.includes(user.id))
            .map((user) => (
              <Avatar
                key={user.id}
                initials={nameInitials(user.displayName)}
                title={user.displayName}
              />
            ))}
        </AvatarStack>
        <Badge tone="positive" fontSize={0}>
          1 here now
        </Badge>
        <Box paddingRight={1}>
          <Text muted size={1}>
            {count}
          </Text>
        </Box>
      </Flex>
    </Card>
  )
}

/**
 * **Recommended (mock).** The same two rows with the resolution: the add-comment
 * affordance is **persistent** (same real button, no hover gate: commenting is
 * discoverable before you hover), and the badge **bears presence**, the avatars of
 * the thread's participants and a live "here now" indicator alongside the count, so
 * activity and co-presence are ambient, before any panel opens. The presence data is
 * prop-driven here; a real implementation reads the existing `presenceStore`.
 */
export const RecommendedPresence: Story = {
  name: 'Recommended (persistent affordance, presence-bearing badge)',
  tags: ['!audit:needs-work', 'audit:holds'],
  parameters: {docs: {story: {height: '360px'}}},
  render: () => (
    <Box padding={4} style={{maxWidth: 480}}>
      <Stack gap={5}>
        <FieldRow
          title="Title"
          gate={false}
          slot={<FieldCommentButton count={0} fieldTitle="Title" />}
        />
        <FieldRow
          title="Body"
          gate={false}
          slot={<PresenceBadge activeUserIds={['ursula', 'octavia']} count={2} />}
        />
      </Stack>
    </Box>
  ),
}
