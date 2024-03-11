import {Box, Flex, Stack, Text} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {AnimatePresence, motion, type Variants} from 'framer-motion'
import {Fragment, useCallback, useEffect, useMemo, useState} from 'react'
import {
  type FormPatch,
  LoadingBlock,
  type PatchEvent,
  type Path,
  useCurrentUser,
  useClient,
  TransactionLogEventWithEffects,
} from 'sanity'
import styled from 'styled-components'

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
import {type TaskDocument} from '../../types'
import {EditedAt} from './TaskActivityEditedAt'
import {TasksActivityCommentInput} from './TasksActivityCommentInput'
import {TasksActivityCreatedAt} from './TasksActivityCreatedAt'
import {ActivityItem} from './TasksActivityItem'
import {TasksSubscribers} from './TasksSubscribers'
import {getJsonStream} from '../../../../../core/store/_legacy/history/history/getJsonStream'
import {FieldChange, trackFieldChanges} from './helpers/parseTransactions'

function useActivityLog(task: TaskDocument) {
  const [changes, setChanges] = useState<FieldChange[]>([])
  const client = useClient()
  const clientConfig = client.config()
  let queryParams = `tag=sanity.studio.tasks.history&effectFormat=mendoza&excludeContent=true&includeIdentifiedDocumentsOnly=true&reverse=true`

  const fetchAndParse = useCallback(
    async (newestTaskDocument: TaskDocument) => {
      const transactions: TransactionLogEventWithEffects[] = []
      const transactionsUrl = client.getUrl(
        `/data/history/${clientConfig.dataset}/transactions/${newestTaskDocument._id}?${queryParams}`,
      )
      const stream = await getJsonStream(transactionsUrl, clientConfig.token)
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
        'assignedTo',
        'status',
        'subscribers',
      ]

      const parsedChanges = await trackFieldChanges(
        newestTaskDocument,
        [...transactions],
        fieldsToTrack,
      )

      setChanges(parsedChanges)
    },
    [client, clientConfig, queryParams],
  )

  // TODO: Probably don't want this to fire every time the task updates
  useEffect(() => {
    fetchAndParse(task)
  }, [fetchAndParse, task])

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

interface ActivityLogItem {
  author: string
  field: string
  from: string
  timestamp: string
  to?: string
}

type Activity =
  | {
      _type: 'comment'
      payload: CommentThreadItem
      timestamp: string
    }
  | {
      _type: 'activity'
      payload: ActivityLogItem
      timestamp: string
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

  // TODO: Get the task real activity.
  const activityData: ActivityLogItem[] = useActivityLog(value)

  const activity: Activity[] = useMemo(() => {
    const taskActivity: Activity[] = activityData.map((item) => ({
      _type: 'activity' as const,
      payload: item as ActivityLogItem,
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
              <Stack space={4} marginTop={1}>
                {taskComments.length > 0 && (
                  <Fragment>
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
                  </Fragment>
                )}

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
  )
}
