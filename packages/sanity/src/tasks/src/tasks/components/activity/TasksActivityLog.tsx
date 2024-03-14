import {Box, Flex, Stack, Text} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {AnimatePresence, motion, type Variants} from 'framer-motion'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {
  type FormPatch,
  getPublishedId,
  LoadingBlock,
  type PatchEvent,
  type Path,
  set,
  type TransactionLogEventWithEffects,
  useClient,
  useCurrentUser,
  useWorkspace,
} from 'sanity'
import styled from 'styled-components'

import {getJsonStream} from '../../../../../core/store/_legacy/history/history/getJsonStream'
import {
  type CommentBaseCreatePayload,
  type CommentCreatePayload,
  type CommentInputProps,
  type CommentReactionOption,
  CommentsListItem,
  type CommentsListItemProps,
  type CommentThreadItem,
  type CommentUpdatePayload,
  useComments,
} from '../../../../../structure/comments'
import {API_VERSION} from '../../constants/API_VERSION'
import {type TaskDocument} from '../../types'
import {CurrentWorkspaceProvider} from '../form/CurrentWorkspaceProvider'
import {getMentionedUsers} from '../form/utils'
import {type FieldChange, trackFieldChanges} from './helpers/parseTransactions'
import {EditedAt} from './TaskActivityEditedAt'
import {TasksActivityCommentInput} from './TasksActivityCommentInput'
import {TasksActivityCreatedAt} from './TasksActivityCreatedAt'
import {ActivityItem} from './TasksActivityItem'
import {TasksSubscribers} from './TasksSubscribers'

function useActivityLog(task: TaskDocument) {
  const [changes, setChanges] = useState<FieldChange[]>([])
  const client = useClient({apiVersion: API_VERSION})
  const {dataset, token} = client.config()

  const queryParams = `tag=sanity.studio.tasks.history&effectFormat=mendoza&excludeContent=true&includeIdentifiedDocumentsOnly=true&reverse=true`
  const transactionsUrl = client.getUrl(
    `/data/history/${dataset}/transactions/${getPublishedId(task._id)}?${queryParams}`,
  )

  const fetchAndParse = useCallback(
    async (newestTaskDocument: TaskDocument) => {
      try {
        const transactions: TransactionLogEventWithEffects[] = []

        const stream = await getJsonStream(transactionsUrl, token)
        const reader = stream.getReader()
        let result
        for (;;) {
          result = await reader.read()
          if (result.done) {
            break
          }
          if ('error' in result.value) {
            throw new Error(result.value.error.description || result.value.error.type)
          }
          transactions.push(result.value)
        }

        const fieldsToTrack: (keyof Omit<TaskDocument, '_rev'>)[] = [
          'createdByUser',
          'title',
          'description',
          'dueBy',
          'assignedTo',
          'status',
          'target',
        ]

        const parsedChanges = await trackFieldChanges(
          newestTaskDocument,
          [...transactions],
          fieldsToTrack,
        )

        setChanges(parsedChanges)
      } catch (error) {
        console.error('Failed to fetch and parse activity log', error)
      }
    },
    [transactionsUrl, token],
  )

  useEffect(() => {
    fetchAndParse(task)
    // Task is updated on every change, wait until the revision changes to update the activity log.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAndParse, task._rev])
  return {changes}
}

const EMPTY_ARRAY: [] = []

const VARIANTS: Variants = {
  hidden: {opacity: 0, x: 0},
  visible: {opacity: 1, x: 0},
}

const COMMENTS_LIST_ITEM_AVATAR_CONFIG: CommentsListItemProps['avatarConfig'] = {
  parentCommentAvatar: false,
  threadCommentsAvatar: true,
  replyAvatar: true,
  avatarSize: 0,
}

const MotionStack = styled(motion(Stack))``

interface TasksActivityLogProps {
  onChange: (patch: FormPatch | PatchEvent | FormPatch[]) => void
  path?: Path
  value: TaskDocument
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
  const {value, onChange, path} = props
  const currentUser = useCurrentUser()
  const {title: workspaceTitle, basePath} = useWorkspace()

  const {comments, mentionOptions, operation, getComment} = useComments()
  const loading = comments.loading
  const taskComments = comments.data.open

  const handleGetNotificationValue = useCallback(
    (message: CommentInputProps['value'], commentId: string) => {
      const studioUrl = new URL(`${window.location.origin}${basePath}/`)
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

  const activityData = useActivityLog(value).changes

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
              <CurrentWorkspaceProvider>
                <Stack space={4} marginTop={1}>
                  {activity.map((item) => {
                    if (item._type === 'activity') {
                      return <EditedAt key={item.timestamp} activity={item.payload} />
                    }
                    return (
                      <ActivityItem
                        key={item.payload.parentComment._id}
                        userId={item.payload.parentComment.authorId}
                      >
                        <CommentsListItem
                          avatarConfig={COMMENTS_LIST_ITEM_AVATAR_CONFIG}
                          canReply
                          currentUser={currentUser}
                          innerPadding={1}
                          isSelected={false}
                          key={item.payload.parentComment._id}
                          mentionOptions={mentionOptions}
                          mode="default" // TODO: set dynamic mode?
                          onCreateRetry={handleCommentCreateRetry}
                          onDelete={handleCommentRemove}
                          onEdit={handleCommentEdit}
                          onReactionSelect={handleCommentReact}
                          onReply={handleCommentReply}
                          parentComment={item.payload.parentComment}
                          replies={item.payload.replies}
                        />
                      </ActivityItem>
                    )
                  })}

                  <TasksActivityCommentInput
                    currentUser={currentUser}
                    mentionOptions={mentionOptions}
                    onSubmit={handleCommentCreate}
                  />
                </Stack>
              </CurrentWorkspaceProvider>
            )}
          </MotionStack>
        )}
      </AnimatePresence>
    </Stack>
  )
}
