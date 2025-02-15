import {type Path} from '@sanity/types'
import {Box, Flex, Stack, Text} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {AnimatePresence, motion, type Variants} from 'framer-motion'
import {useCallback, useMemo, useState} from 'react'
import {styled} from 'styled-components'

import {
  type CommentBaseCreatePayload,
  type CommentCreatePayload,
  type CommentInputProps,
  type CommentReactionOption,
  type CommentThreadItem,
  type CommentUpdatePayload,
  useComments,
} from '../../../comments'
import {CommentDeleteDialog} from '../../../comments/components'
import {LoadingBlock} from '../../../components'
import {type FormPatch, type PatchEvent, set} from '../../../form'
import {useTranslation} from '../../../i18n'
import {useCurrentUser} from '../../../store'
import {useWorkspace} from '../../../studio'
import {tasksLocaleNamespace} from '../../i18n'
import {type TaskDocument} from '../../types'
import {getMentionedUsers} from '../form/utils'
import {type FieldChange} from './helpers/parseTransactions'
import {EditedAt} from './TaskActivityEditedAt'
import {TasksActivityCommentInput} from './TasksActivityCommentInput'
import {TasksActivityCommentItem} from './TasksActivityCommentItem'
import {TasksActivityCreatedAt} from './TasksActivityCreatedAt'
import {TasksSubscribers} from './TasksSubscribers'

const EMPTY_ARRAY: [] = []

const VARIANTS: Variants = {
  hidden: {opacity: 0, x: 0},
  visible: {opacity: 1, x: 0},
}

const MotionStack = styled(motion.create(Stack))``

interface TasksActivityLogProps {
  onChange: (patch: FormPatch | PatchEvent | FormPatch[]) => void
  path?: Path
  value: TaskDocument
  activityData: FieldChange[]
}

type Activity =
  | {
      _type: 'comment'
      payload: CommentThreadItem
      timestamp: string
    }
  | {
      _type: 'activity'
      payload: FieldChange
      timestamp: string
    }

export function TasksActivityLog(props: TasksActivityLogProps) {
  const {value, onChange, path, activityData = []} = props
  const currentUser = useCurrentUser()

  const {title: workspaceTitle, basePath} = useWorkspace()
  const {comments, mentionOptions, operation, getComment} = useComments()
  const [commentToDeleteId, setCommentToDeleteId] = useState<string | null>(null)
  const [commentDeleteError, setCommentDeleteError] = useState<Error | null>(null)
  const [commentDeleteLoading, setCommentDeleteLoading] = useState(false)

  const loading = comments.loading
  const taskComments = comments.data.open
  const handleGetNotificationValue = useCallback(
    (message: CommentInputProps['value'], commentId: string) => {
      const studioUrl = new URL(`${window.location.origin}${basePath ? `${basePath}/` : ''}`)

      studioUrl.searchParams.set('sidebar', 'tasks')
      studioUrl.searchParams.set('selectedTask', value?._id)
      studioUrl.searchParams.set('viewMode', 'edit')
      studioUrl.searchParams.set('commentId', commentId)

      const mentionedUsers = getMentionedUsers(message)
      const subscribers = Array.from(new Set([...(value.subscribers || []), ...mentionedUsers]))

      return {
        documentTitle: value.title || 'Sanity task',
        url: studioUrl.toString(),
        workspaceTitle: workspaceTitle,
        subscribers: subscribers,
      }
    },
    [basePath, value?._id, value.title, workspaceTitle, value.subscribers],
  )

  const handleCommentCreate = useCallback(
    (message: CommentInputProps['value']) => {
      const commentId = uuid()
      const notification = handleGetNotificationValue(message, commentId)

      const nextComment: CommentCreatePayload = {
        id: commentId,
        type: 'task',
        message,
        parentCommentId: undefined,
        reactions: EMPTY_ARRAY,
        status: 'open',
        threadId: uuid(),
        context: {
          notification,
        },
      }

      onChange(set(notification.subscribers, ['subscribers']))

      operation.create(nextComment)
    },
    [operation, handleGetNotificationValue, onChange],
  )

  const handleCommentReply = useCallback(
    (nextComment: CommentBaseCreatePayload) => {
      const commentId = uuid()

      const notification = handleGetNotificationValue(nextComment.message, commentId)

      onChange(set(notification.subscribers, ['subscribers']))

      operation.create({
        id: commentId,
        type: 'task',
        message: nextComment.message,
        parentCommentId: nextComment.parentCommentId,
        reactions: EMPTY_ARRAY,
        status: 'open',
        threadId: nextComment.threadId,
        context: {
          notification,
        },
      })
    },
    [operation, handleGetNotificationValue, onChange],
  )

  const handleCommentCreateRetry = useCallback(
    (id: string) => {
      // Get the optimistically created comment and use it
      // when retrying the creation.
      const comment = getComment(id)
      if (!comment) return

      const notification = handleGetNotificationValue(comment.message, comment._id)

      onChange(set(notification.subscribers, ['subscribers']))

      operation.create({
        type: 'task',
        id: comment._id,
        message: comment.message,
        parentCommentId: comment.parentCommentId,
        reactions: comment.reactions || EMPTY_ARRAY,
        status: comment.status,
        threadId: comment.threadId,
        context: {
          notification,
        },
      })
    },
    [getComment, operation, handleGetNotificationValue, onChange],
  )

  const handleCommentReact = useCallback(
    (id: string, reaction: CommentReactionOption) => {
      operation.react(id, reaction)
    },
    [operation],
  )

  const handleDeleteCommentStart = useCallback((id: string) => setCommentToDeleteId(id), [])
  const handleDeleteCommentCancel = useCallback(() => setCommentToDeleteId(null), [])

  const handleDeleteCommentConfirm = useCallback(
    async (id: string) => {
      try {
        setCommentDeleteLoading(true)
        setCommentDeleteError(null)
        await operation.remove(id)
        setCommentToDeleteId(null)
      } catch (err) {
        setCommentDeleteError(err)
      } finally {
        setCommentDeleteLoading(false)
      }
    },
    [operation],
  )

  const handleCommentEdit = useCallback(
    (id: string, next: CommentUpdatePayload) => {
      operation.update(id, next)
    },
    [operation],
  )

  const activity: Activity[] = useMemo(() => {
    const taskActivity: Activity[] = activityData.map((item) => ({
      _type: 'activity' as const,
      payload: item,
      timestamp: item.timestamp,
    }))
    const commentsActivity: Activity[] = taskComments.map((comment) => ({
      _type: 'comment' as const,
      payload: comment,
      timestamp: comment.parentComment._createdAt,
    }))

    return taskActivity
      .concat(commentsActivity)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }, [activityData, taskComments])
  const {t} = useTranslation(tasksLocaleNamespace)

  const commentToDeleteIsParent = useMemo(() => {
    const parent = taskComments.find((c) => c.parentComment?._id === commentToDeleteId)
    const isParent = Boolean(parent && parent?.replies?.length > 0)

    return isParent
  }, [commentToDeleteId, taskComments])

  return (
    <>
      {commentToDeleteId && (
        <CommentDeleteDialog
          commentId={commentToDeleteId}
          error={commentDeleteError}
          isParent={commentToDeleteIsParent}
          loading={commentDeleteLoading}
          onClose={handleDeleteCommentCancel}
          onConfirm={handleDeleteCommentConfirm}
        />
      )}

      <Stack space={5}>
        <Flex align="center">
          <Box flex={1}>
            <Text size={2} weight="semibold">
              {t('panel.activity.title')}
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
            <MotionStack animate="visible" initial="hidden" space={4} variants={VARIANTS}>
              {value.createdByUser && (
                <Stack paddingBottom={1}>
                  <TasksActivityCreatedAt
                    createdAt={value.createdByUser}
                    authorId={value.authorId}
                  />
                </Stack>
              )}

              {currentUser && (
                <Stack space={4} marginTop={1}>
                  {activity.map((item) => {
                    if (item._type === 'activity') {
                      return <EditedAt key={item.timestamp} activity={item.payload} />
                    }

                    return (
                      <TasksActivityCommentItem
                        currentUser={currentUser}
                        key={item.payload.parentComment._id}
                        mentionOptions={mentionOptions}
                        onCreateRetry={handleCommentCreateRetry}
                        onDelete={handleDeleteCommentStart}
                        onEdit={handleCommentEdit}
                        onReactionSelect={handleCommentReact}
                        onReply={handleCommentReply}
                        parentComment={item.payload.parentComment}
                        replies={item.payload.replies}
                      />
                    )
                  })}

                  <TasksActivityCommentInput
                    currentUser={currentUser}
                    mentionOptions={mentionOptions}
                    onSubmit={handleCommentCreate}
                  />
                </Stack>
              )}
            </MotionStack>
          )}
        </AnimatePresence>
      </Stack>
    </>
  )
}
