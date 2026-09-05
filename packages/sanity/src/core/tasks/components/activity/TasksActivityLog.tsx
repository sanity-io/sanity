import {type Path, type PortableTextBlock} from '@sanity/types'
import {Stack, Text} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {AnimatePresence, motion, type Variants} from 'motion/react'
import {useMemo, useState} from 'react'
import {styled} from 'styled-components'
import {Flex, Box} from 'ui5'

import {CommentDeleteDialog as CommentDeleteDialogV2} from '../../../comments-v2/components/CommentDeleteDialog'
import {useComments as useCommentsV2} from '../../../comments-v2/hooks/useComments'
import {CommentDeleteDialog} from '../../../comments/components/CommentDeleteDialog'
import {useComments} from '../../../comments/hooks/useComments'
import {LoadingBlock} from '../../../components/loadingBlock/LoadingBlock'
import {set} from '../../../form/patch/patch'
import {type PatchEvent} from '../../../form/patch/PatchEvent'
import {type FormPatch} from '../../../form/patch/types'
import {type UserListWithPermissionsHookValue} from '../../../hooks/useUserListWithPermissions'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useCurrentUser} from '../../../store/user/hooks'
import {useWorkspace} from '../../../studio/workspace'
import {
  TASKS_SELECTED_TASK_SEARCH_PARAM,
  TASKS_SIDEBAR_SEARCH_PARAM,
  TASKS_VIEW_MODE_SEARCH_PARAM,
} from '../../context/navigation/types'
import {tasksLocaleNamespace} from '../../i18n'
import {type TaskDocument} from '../../types'
import {getMentionedUsers} from '../form/utils'
import {type FieldChange} from './helpers/parseTransactions'
import {EditedAt} from './TaskActivityEditedAt'
import {TasksActivityCommentInput} from './TasksActivityCommentInput'
import {TasksActivityCommentItem} from './TasksActivityCommentItem'
import {TasksActivityCreatedAt} from './TasksActivityCreatedAt'
import {TasksSubscribers} from './TasksSubscribers'
import {type TaskCommentCreate, type TaskCommentNotification, type TaskCommentReply} from './types'

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

/**
 * What the activity feed needs to know about a comment thread, so that it does
 * not have to deal with the comment types of a specific comments
 * implementation.
 */
interface TaskCommentThread {
  createdAt: string
  /**
   * The id of the thread's first comment.
   */
  id: string
  replyCount: number
}

function getNotificationValue(
  message: PortableTextBlock[] | null,
  commentId: string,
  options: {
    basePath: string
    mentionOptions: UserListWithPermissionsHookValue
    task: TaskDocument
    workspaceName: string
    workspaceTitle: string
  },
): TaskCommentNotification {
  const {basePath, mentionOptions, task, workspaceName, workspaceTitle} = options
  const studioUrl = new URL(`${window.location.origin}${basePath ? `${basePath}/` : ''}`)

  studioUrl.searchParams.set(TASKS_SIDEBAR_SEARCH_PARAM, 'tasks')
  studioUrl.searchParams.set(TASKS_SELECTED_TASK_SEARCH_PARAM, task?._id)
  studioUrl.searchParams.set(TASKS_VIEW_MODE_SEARCH_PARAM, 'edit')
  studioUrl.searchParams.set('commentId', commentId)

  // Mentions are stored with the user id of the comments implementation in use,
  // which is a global user id in some of them. Task subscribers are project
  // user ids, so resolve the mentioned user back to that.
  const mentionedUsers = getMentionedUsers(message).map((userId) => {
    const mentionedUser = mentionOptions.data?.find((user) => user.id === userId)
    return mentionedUser?.projectUserId ?? userId
  })
  const subscribers = Array.from(new Set([...(task.subscribers || []), ...mentionedUsers]))

  return {
    documentTitle: task.title || 'Sanity task',
    url: studioUrl.toString(),
    workspaceTitle,
    workspaceName,
    subscribers,
  }
}

type Activity =
  | {
      _type: 'comment'
      payload: TaskCommentThread
      timestamp: string
    }
  | {
      _type: 'activity'
      payload: FieldChange
      timestamp: string
    }

/**
 * The activity feed on a task: comments and field changes in one chronological
 * list, with a comment editor at the bottom.
 *
 * Comments are read from and written to whichever comments implementation the
 * task is using. Since each of those has its own provider and hook, that part
 * happens here, and the feed below is given comment threads reduced to what it
 * needs.
 */
export function TasksActivityLog(props: TasksActivityLogProps) {
  const {beta} = useWorkspace()

  if (beta?.comments?.v2) {
    return <TasksActivityLogV2 {...props} />
  }

  return <TasksActivityLogV1 {...props} />
}

/**
 * Reads and writes comments via the v1 comments context.
 */
function TasksActivityLogV1(props: TasksActivityLogProps) {
  const {comments, mentionOptions, operation, getComment} = useComments()

  const taskComments = useMemo(
    () =>
      comments.data.open.map((thread): TaskCommentThread => ({
        createdAt: thread.parentComment._createdAt,
        id: thread.parentComment._id,
        replyCount: thread.replies.length,
      })),
    [comments.data.open],
  )

  return (
    <TasksActivityLogFeed
      {...props}
      getComment={getComment}
      loading={comments.loading}
      mentionOptions={mentionOptions}
      onCommentCreate={operation.create}
      onCommentRemove={operation.remove}
      taskComments={taskComments}
    />
  )
}

/**
 * Reads and writes comments via the v2 comments context.
 */
function TasksActivityLogV2(props: TasksActivityLogProps) {
  const {comments, mentionOptions, operation, getComment} = useCommentsV2()

  const taskComments = useMemo(
    () =>
      comments.data.open.map((thread): TaskCommentThread => ({
        createdAt: thread.parentComment._createdAt,
        id: thread.parentComment._id,
        replyCount: thread.replies.length,
      })),
    [comments.data.open],
  )

  return (
    <TasksActivityLogFeed
      {...props}
      getComment={getComment}
      loading={comments.loading}
      mentionOptions={mentionOptions}
      onCommentCreate={operation.create}
      onCommentRemove={operation.remove}
      taskComments={taskComments}
    />
  )
}

interface TasksActivityLogFeedProps extends TasksActivityLogProps {
  /**
   * Looks up a comment in the comments implementation the task is using.
   * Used when retrying a failed create.
   */
  getComment: (id: string) => TaskCommentRetry | undefined
  loading: boolean
  mentionOptions: UserListWithPermissionsHookValue
  onCommentCreate: (comment: TaskCommentCreate) => Promise<void>
  onCommentRemove: (id: string) => Promise<void>
  taskComments: TaskCommentThread[]
}

/**
 * Fields retry needs from the comments store. Both implementations expose these.
 */
interface TaskCommentRetry {
  _id: string
  message: PortableTextBlock[] | null
  parentCommentId?: string
  threadId: string
}

/**
 * Chronological feed of field changes and comments, plus the comments input.
 */
function TasksActivityLogFeed(props: TasksActivityLogFeedProps) {
  const {
    value,
    onChange,
    path,
    activityData = [],
    getComment,
    loading,
    mentionOptions,
    onCommentCreate,
    onCommentRemove,
    taskComments,
  } = props
  const currentUser = useCurrentUser()
  const {title: workspaceTitle, basePath, name: workspaceName, beta} = useWorkspace()

  const [commentToDeleteId, setCommentToDeleteId] = useState<string | null>(null)
  const [commentDeleteError, setCommentDeleteError] = useState<Error | null>(null)
  const [commentDeleteLoading, setCommentDeleteLoading] = useState(false)

  const handleCommentCreate = async (message: PortableTextBlock[] | null) => {
    const commentId = uuid()
    const notification = getNotificationValue(message, commentId, {
      basePath,
      mentionOptions,
      task: value,
      workspaceName,
      workspaceTitle,
    })

    onChange(set(notification.subscribers, ['subscribers']))

    await onCommentCreate({
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
    })
  }

  const handleCommentReply = async (reply: TaskCommentReply) => {
    const commentId = uuid()
    const notification = getNotificationValue(reply.message, commentId, {
      basePath,
      mentionOptions,
      task: value,
      workspaceName,
      workspaceTitle,
    })

    onChange(set(notification.subscribers, ['subscribers']))

    await onCommentCreate({
      id: commentId,
      type: 'task',
      message: reply.message,
      parentCommentId: reply.parentCommentId,
      reactions: EMPTY_ARRAY,
      status: 'open',
      threadId: reply.threadId,
      context: {
        notification,
      },
    })
  }

  const handleCommentCreateRetry = async (id: string) => {
    // Get the optimistically created comment and use it
    // when retrying the creation.
    const comment = getComment(id)
    if (!comment) return

    const notification = getNotificationValue(comment.message, comment._id, {
      basePath,
      mentionOptions,
      task: value,
      workspaceName,
      workspaceTitle,
    })

    onChange(set(notification.subscribers, ['subscribers']))

    await onCommentCreate({
      id: comment._id,
      type: 'task',
      message: comment.message,
      parentCommentId: comment.parentCommentId,
      reactions: EMPTY_ARRAY,
      status: 'open',
      threadId: comment.threadId,
      context: {
        notification,
      },
    })
  }

  const handleDeleteCommentStart = (id: string) => setCommentToDeleteId(id)
  const handleDeleteCommentCancel = () => setCommentToDeleteId(null)

  const handleDeleteCommentConfirm = async (id: string) => {
    try {
      setCommentDeleteLoading(true)
      setCommentDeleteError(null)
      await onCommentRemove(id)
      setCommentToDeleteId(null)
    } catch (err) {
      setCommentDeleteError(err)
    }
    setCommentDeleteLoading(false)
  }

  const activity: Activity[] = useMemo(() => {
    const taskActivity: Activity[] = activityData.map((item) => ({
      _type: 'activity' as const,
      payload: item,
      timestamp: item.timestamp,
    }))
    const commentsActivity: Activity[] = taskComments.map((comment) => ({
      _type: 'comment' as const,
      payload: comment,
      timestamp: comment.createdAt,
    }))

    return taskActivity
      .concat(commentsActivity)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }, [activityData, taskComments])
  const {t} = useTranslation(tasksLocaleNamespace)

  const commentToDeleteIsParent = useMemo(() => {
    const parent = taskComments.find((c) => c.id === commentToDeleteId)
    const isParent = Boolean(parent && parent.replyCount > 0)

    return isParent
  }, [commentToDeleteId, taskComments])

  // Pick the delete dialog for the comments implementation the workspace is using.
  const DeleteDialog = beta?.comments?.v2 ? CommentDeleteDialogV2 : CommentDeleteDialog

  return (
    <>
      {commentToDeleteId && (
        <DeleteDialog
          commentId={commentToDeleteId}
          error={commentDeleteError}
          isParent={commentToDeleteIsParent}
          loading={commentDeleteLoading}
          onClose={handleDeleteCommentCancel}
          onConfirm={handleDeleteCommentConfirm}
        />
      )}

      <Stack gap={5}>
        <Flex alignItems="center">
          <Box flexBasis="0%" flexGrow={1}>
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
            <MotionStack animate="visible" initial="hidden" gap={4} variants={VARIANTS}>
              {value.createdByUser && (
                <Stack paddingBottom={1}>
                  <TasksActivityCreatedAt
                    createdAt={value.createdByUser}
                    authorId={value.authorId}
                  />
                </Stack>
              )}

              {currentUser && (
                <Stack gap={4} marginTop={1}>
                  {activity.map((item) => {
                    if (item._type === 'activity') {
                      return <EditedAt key={item.timestamp} activity={item.payload} />
                    }

                    return (
                      <TasksActivityCommentItem
                        key={item.payload.id}
                        commentId={item.payload.id}
                        currentUser={currentUser}
                        mentionOptions={mentionOptions}
                        onCreateRetry={handleCommentCreateRetry}
                        onDelete={handleDeleteCommentStart}
                        onReply={handleCommentReply}
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
