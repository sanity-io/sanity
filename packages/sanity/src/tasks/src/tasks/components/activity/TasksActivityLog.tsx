// This file is a WIP.
import {hues} from '@sanity/color'
import {DotIcon} from '@sanity/icons'
import {Box, Card, Flex, Inline, Stack, Text} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {AnimatePresence, motion, type Variants} from 'framer-motion'
import {Fragment, useCallback, useMemo} from 'react'
import {
  LoadingBlock,
  useCurrentUser,
  useDateTimeFormat,
  type UseDateTimeFormatOptions,
  UserAvatar,
  useUser,
} from 'sanity'
import styled, {css} from 'styled-components'

import {
  type CommentCreatePayload,
  type CommentInputProps,
  type CommentReactionOption,
  CommentsListItem,
  type CommentUpdatePayload,
  useComments,
} from '../../../../../structure/comments'
import {Button} from '../../../../../ui-components'
import {type TaskDocument} from '../../types'
import {TasksCommentInput} from '../comments'

const EMPTY_ARRAY: [] = []

const MotionStack = styled(motion(Stack))``

const VARIANTS: Variants = {
  hidden: {opacity: 0, x: 0},
  visible: {opacity: 1, x: 0},
}

const TimeText = styled(Text)(({theme}) => {
  const isDark = theme.sanity.color.dark
  const fg = hues.gray[isDark ? 200 : 800].hex

  return css`
    min-width: max-content;
    --card-fg-color: ${fg};
  `
})

interface CreateAtProps {
  createdAt: string
  authorId: string
}

const DATE_FORMAT_OPTIONS: UseDateTimeFormatOptions = {
  dateStyle: 'medium',
}

function CreatedAt(props: CreateAtProps) {
  const {createdAt, authorId} = props
  const [user] = useUser(authorId)

  const dateFormatter = useDateTimeFormat(DATE_FORMAT_OPTIONS)

  const dueByeDisplayValue = useMemo<string | undefined>(() => {
    const formattedDate = dateFormatter.format(new Date(createdAt))
    const [day] = formattedDate.split(',')
    const hour = new Date(createdAt).getHours()
    const minutes = new Date(createdAt).getMinutes()
    return `${day}, ${hour}:${minutes}`
  }, [createdAt, dateFormatter])

  if (!user) {
    return <Text size={0}>Unknown user created this task at {createdAt}</Text>
  }

  return (
    <Flex align="center" gap={3}>
      <Flex justify="center" style={{width: 25}}>
        <UserAvatar
          __unstable_hideInnerStroke
          // @ts-expect-error `color` is not a valid prop on UserAvatar but it is sent to the `avatar`
          color={user.imageUrl ? null : undefined}
          size={0}
          user={user}
        />
      </Flex>

      <Inline space={2} flex={1}>
        <Text size={1} weight="medium">
          {user.displayName}
        </Text>

        <TimeText size={0}>
          created this task <DotIcon /> {dueByeDisplayValue}
        </TimeText>
      </Inline>
    </Flex>
  )
}

export function TasksActivityLog({value}: {value: TaskDocument}) {
  const currentUser = useCurrentUser()
  const {mentionOptions, operation, comments, getComment} = useComments()

  const loading = comments.loading

  const taskComments = useMemo(() => {
    // The default order is oldest first, so we reverse it to get the newest first.
    return comments.data.open?.slice().reverse()
  }, [comments.data.open])

  const handleCommentCreate = useCallback(
    (message: CommentInputProps['value']) => {
      const nextComment: CommentCreatePayload = {
        scope: 'task',
        message,
        parentCommentId: undefined,
        reactions: EMPTY_ARRAY,
        status: 'open',
        threadId: uuid(),
      }

      operation.create(nextComment)
    },
    [operation],
  )

  const handleCommentReply = useCallback(
    (nextComment: CommentCreatePayload) => {
      operation.create({
        scope: 'task',
        message: nextComment.message,
        parentCommentId: nextComment.parentCommentId,
        reactions: EMPTY_ARRAY,
        status: 'open',
        threadId: nextComment.threadId,
      })
    },
    [operation],
  )

  const handleCommentCreateRetry = useCallback(
    (id: string) => {
      const comment = getComment(id)
      if (!comment) return

      operation.create({
        scope: 'task',
        id: comment._id,
        message: comment.message,
        parentCommentId: comment.parentCommentId,
        reactions: comment.reactions || EMPTY_ARRAY,
        status: comment.status,
        threadId: comment.threadId,
      })
    },
    [getComment, operation],
  )

  const handleCommentReact = useCallback(
    (id: string, reaction: CommentReactionOption) => {
      operation.react(id, reaction)
    },
    [operation],
  )

  const handleCommentRemove = useCallback(
    (id: string) => {
      // TODO: the remove operation is not optimistic. We should display a
      // dialog to confirm the removal and wait for the server to respond
      // before removing the comment from the UI. (See `CommentsDocumentInspector`)
      operation.remove(id)
    },
    [operation],
  )

  const handleCommentEdit = useCallback(
    (id: string, next: CommentUpdatePayload) => {
      operation.update(id, next)
    },
    [operation],
  )

  return (
    <Stack space={4}>
      <Card borderTop paddingTop={5} sizing="border">
        <Flex align="center">
          <Box flex={1}>
            <Text size={1} weight="medium">
              Activity
            </Text>
          </Box>

          <Button mode="bleed" text="Subscribe" />
        </Flex>
      </Card>

      {loading && <LoadingBlock showText title="Loading activity" />}

      <AnimatePresence>
        {!loading && (
          <MotionStack animate="visible" initial="hidden" space={3} variants={VARIANTS}>
            {value.createdByUser && (
              <Stack paddingBottom={1}>
                <CreatedAt createdAt={value.createdByUser} authorId={value.authorId} />
              </Stack>
            )}

            {currentUser && (
              <Fragment>
                {taskComments.map((c) => {
                  return (
                    <CommentsListItem
                      canReply
                      currentUser={currentUser}
                      isSelected={false}
                      key={c.parentComment._id}
                      mentionOptions={mentionOptions}
                      mode="default" // TODO: set dynamic mode?
                      onCreateRetry={handleCommentCreateRetry}
                      onDelete={handleCommentRemove}
                      onEdit={handleCommentEdit}
                      onReactionSelect={handleCommentReact}
                      onReply={handleCommentReply}
                      parentComment={c.parentComment}
                      replies={c.replies.slice().reverse()} // TODO: figure out a better way than reversing the array
                    />
                  )
                })}

                <TasksCommentInput
                  currentUser={currentUser}
                  mentionOptions={mentionOptions}
                  onSubmit={handleCommentCreate}
                />
              </Fragment>
            )}
          </MotionStack>
        )}
      </AnimatePresence>
    </Stack>
  )
}
