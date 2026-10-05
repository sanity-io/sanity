import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {LaunchIcon} from '@sanity/icons/Launch'
import {type UseCommentThreadsResult, useCommentActions, useUser} from '@sanity/sdk-react'
import {Avatar, Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {useState} from 'react'

import {CommentComposer, type CommentSubmission} from './CommentComposer'
import {LoadBoundary} from './LoadBoundary'

type CommentThread = UseCommentThreadsResult['threads'][number]
type Comment = CommentThread['parentComment']
type MessageChild = {_key?: string; _type: string; text?: unknown; userId?: unknown}

function toFieldLabel(fieldPath: string): string {
  const fieldName = fieldPath.split(/[.[]/)[0] ?? ''
  return fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
}

interface CommentThreadRowProps {
  thread: CommentThread
  onSelect: () => void
  onOpenEntry: () => void
}

export function CommentThreadRow({thread, onSelect, onOpenEntry}: CommentThreadRowProps) {
  const {parentComment, replies} = thread
  const {replyToComment, setCommentStatus} = useCommentActions()
  const [isReplying, setIsReplying] = useState(false)

  function resolve() {
    setCommentStatus({commentId: parentComment.id, status: 'resolved'}).catch((error: unknown) =>
      console.error('Failed to resolve the comment', error),
    )
  }

  function submitReply(submission: CommentSubmission) {
    return replyToComment({
      documentId: parentComment.documentId,
      documentType: parentComment.documentType,
      parentCommentId: parentComment.id,
      ...submission,
    })
  }

  return (
    <Card borderTop padding={2}>
      <Stack gap={2}>
        <Card as="button" radius={2} padding={2} title="Show in the collection" onClick={onSelect}>
          <CommentEntry comment={parentComment} fieldLabel={toFieldLabel(thread.fieldPath)} />
        </Card>
        {replies.map((reply) => (
          <Box key={reply.id} paddingLeft={4} paddingRight={2}>
            <CommentEntry comment={reply} />
          </Box>
        ))}
        {isReplying ? (
          <CommentComposer
            label="Reply"
            onSubmit={submitReply}
            onClose={() => setIsReplying(false)}
          />
        ) : null}
        <Flex gap={1} justify="flex-end">
          <Button
            fontSize={1}
            mode="bleed"
            padding={2}
            text="Reply"
            disabled={isReplying}
            onClick={() => setIsReplying(true)}
          />
          <Button
            fontSize={1}
            icon={CheckmarkCircleIcon}
            mode="bleed"
            padding={2}
            text="Resolve"
            onClick={resolve}
          />
          <Button
            fontSize={1}
            icon={LaunchIcon}
            mode="bleed"
            padding={2}
            text="Open entry"
            onClick={onOpenEntry}
          />
        </Flex>
      </Stack>
    </Card>
  )
}

function CommentEntry({comment, fieldLabel}: {comment: Comment; fieldLabel?: string}) {
  return (
    <Stack gap={2}>
      <Flex align="center" gap={2}>
        <Author userId={comment.authorId} />
        {fieldLabel === undefined ? null : (
          <Text muted size={0}>
            {fieldLabel}
          </Text>
        )}
      </Flex>
      <MessageText message={comment.message} />
    </Stack>
  )
}

// An agent-written comment has no author id, and a user who left the project fails to load.
function Author({userId}: {userId: string | undefined}) {
  const unknownAuthor = <AuthorLabel name="Unknown user" />

  return userId === undefined ? (
    unknownAuthor
  ) : (
    <LoadBoundary loading={<AuthorLabel name="" />} failed={unknownAuthor}>
      <KnownAuthor userId={userId} />
    </LoadBoundary>
  )
}

function KnownAuthor({userId}: {userId: string}) {
  const {data: user} = useUser({userId})
  return (
    <AuthorLabel
      name={user?.profile.displayName ?? 'Unknown user'}
      imageUrl={user?.profile.imageUrl}
    />
  )
}

function AuthorLabel({name, imageUrl}: {name: string; imageUrl?: string}) {
  return (
    <Flex align="center" gap={2}>
      <Avatar size={0} src={imageUrl} initials={name.charAt(0)} title={name} />
      <Text size={1} weight="medium">
        {name}
      </Text>
    </Flex>
  )
}

function isMessageChild(value: unknown): value is MessageChild {
  return value instanceof Object && '_type' in value
}

function readChildren(block: NonNullable<Comment['message']>[number]): MessageChild[] {
  const children: unknown = block.children
  return Array.isArray(children) ? children.filter(isMessageChild) : []
}

// Spans plus mentions, which `toPlainText` from `@portabletext/toolkit` drops.
function MessageText({message}: {message: Comment['message']}) {
  return (
    <Stack gap={2}>
      {(message ?? []).map((block) => (
        <Text key={block._key} size={1}>
          {readChildren(block).map((child, index) => (
            <MessageChildText key={child._key ?? index} child={child} />
          ))}
        </Text>
      ))}
    </Stack>
  )
}

function MessageChildText({child}: {child: MessageChild}) {
  if (child._type === 'mention' && typeof child.userId === 'string') {
    return (
      <strong>
        @
        <LoadBoundary loading="…" failed="Unknown user">
          <UserName userId={child.userId} />
        </LoadBoundary>
      </strong>
    )
  }
  return typeof child.text === 'string' ? child.text : null
}

function UserName({userId}: {userId: string}) {
  const {data: user} = useUser({userId})
  return user?.profile.displayName ?? 'Unknown user'
}
