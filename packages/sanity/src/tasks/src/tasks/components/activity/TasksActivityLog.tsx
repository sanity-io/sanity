import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {AnimatePresence, motion, type Variants} from 'framer-motion'
import {Fragment, useCallback} from 'react'
import {type FormPatch, LoadingBlock, type PatchEvent, type Path, useCurrentUser} from 'sanity'
import styled from 'styled-components'

import {
  type CommentBaseCreatePayload,
  type CommentCreatePayload,
  type CommentInputProps,
  type CommentReactionOption,
  CommentsListItem,
  type CommentUpdatePayload,
  useComments,
} from '../../../../../structure/comments'
import {type TaskDocument} from '../../types'
import {TasksActivityCommentInput} from './TasksActivityCommentInput'
import {TasksActivityCreatedAt} from './TasksActivityCreatedAt'
import {TasksSubscribers} from './TasksSubscribers'

const EMPTY_ARRAY: [] = []

const MotionStack = styled(motion(Stack))``

const VARIANTS: Variants = {
  hidden: {opacity: 0, x: 0},
  visible: {opacity: 1, x: 0},
}

interface TasksActivityLogProps {
  onChange: (patch: FormPatch | PatchEvent | FormPatch[]) => void
  path?: Path
  value: TaskDocument
}

export function TasksActivityLog(props: TasksActivityLogProps) {
  const {value, onChange, path} = props
  const currentUser = useCurrentUser()

  const {comments, mentionOptions, operation, getComment} = useComments()
  const loading = comments.loading
  const taskComments = comments.data.open

  const handleCommentCreate = useCallback(
    (message: CommentInputProps['value']) => {
      const nextComment: CommentCreatePayload = {
        type: 'task',
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
    (nextComment: CommentBaseCreatePayload) => {
      operation.create({
        type: 'task',
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
      // Get the optimistically created comment and use it
      // when retrying the creation.
      const comment = getComment(id)
      if (!comment) return

      operation.create({
        type: 'task',
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
      // TODO:
      // The remove operation is not optimistic. We should display a
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
    <Stack space={5}>
      <Flex align="center">
        <Box flex={1}>
          <Text size={2} weight="semibold">
            Activity
          </Text>
        </Box>

        {currentUser?.id && (
          <TasksSubscribers
            currentUserId={currentUser.id}
            value={value}
            onChange={onChange}
            path={path}
          />
        )}
      </Flex>

      {loading && <LoadingBlock showText title="Loading activity" />}

      <AnimatePresence>
        {!loading && (
          <MotionStack animate="visible" initial="hidden" space={3} variants={VARIANTS}>
            {value.createdByUser && (
              <Stack paddingBottom={1}>
                <TasksActivityCreatedAt createdAt={value.createdByUser} authorId={value.authorId} />
              </Stack>
            )}

            {currentUser && (
              <Stack space={2} marginTop={1}>
                {taskComments.length > 0 && (
                  <Fragment>
                    {taskComments.map((c) => {
                      return (
                        <Stack key={c.parentComment._id}>
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
                            replies={c.replies}
                          />
                        </Stack>
                      )
                    })}
                  </Fragment>
                )}

                <Card tone="transparent" padding={3} radius={3}>
                  <TasksActivityCommentInput
                    currentUser={currentUser}
                    mentionOptions={mentionOptions}
                    onSubmit={handleCommentCreate}
                  />
                </Card>
              </Stack>
            )}
          </MotionStack>
        )}
      </AnimatePresence>
    </Stack>
  )
}
