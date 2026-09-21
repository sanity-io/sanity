import {type SanityClient} from '@sanity/client'
import {type CurrentUser} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import {
  AddonDatasetContext,
  CommentsContext,
  TasksContext,
  TasksEnabledContext,
  TasksNavigationContext,
} from 'sanity/_singletons'
import {Box} from 'ui5'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {type CommentsContextValue} from '../../comments/context/comments/types'
import {type CommentThreadItem} from '../../comments/types'
import {type ActiveToolLayoutProps} from '../../config/studio/types'
import {type UserListWithPermissionsHookValue} from '../../hooks/useUserListWithPermissions'
import {type AddonDatasetContextValue} from '../../studio/addonDataset/types'
import {TasksActivityCommentItem} from '../components/activity/TasksActivityCommentItem'
import {FormEditRow} from '../components/form/tasksFormBuilder/FormEdit'
import {TasksFormBuilder} from '../components/form/tasksFormBuilder/TasksFormBuilder'
import {TasksList} from '../components/list/TasksList'
import {TasksStudioSidebar} from '../components/sidebar/TasksSidebar'
import {type State, type TasksNavigationContextValue} from '../context/navigation/types'
import {type TasksContextValue} from '../context/tasks/types'
import {tasksUsEnglishLocaleBundle} from '../i18n'
import {TasksStudioActiveToolLayout} from '../plugin/TasksStudioActiveToolLayout'
import {type TaskDocument} from '../types'

const NOOP = () => undefined
const ASYNC_NOOP = async () => null
const ASYNC_VOID = async () => undefined
const ADDON_CLIENT = {
  config: () => ({dataset: 'tasks'}),
} as SanityClient

const TARGET = {
  documentType: 'article',
  document: {
    _dataset: 'test',
    _projectId: 'test',
    _ref: 'article-1',
    _type: 'crossDatasetReference' as const,
    _weak: true,
  },
}

const TASKS: TaskDocument[] = [
  {
    _createdAt: '2024-01-01T00:00:00.000Z',
    _id: 'task-open',
    _rev: 'task-open-rev',
    _type: 'tasks.task',
    _updatedAt: '2024-01-01T00:00:00.000Z',
    authorId: 'grrm',
    createdByUser: 'grrm',
    status: 'open',
    target: TARGET,
    title: 'Review the hero image crop',
  },
  {
    _createdAt: '2024-01-01T00:00:00.000Z',
    _id: 'task-closed',
    _rev: 'task-closed-rev',
    _type: 'tasks.task',
    _updatedAt: '2024-01-01T00:00:00.000Z',
    authorId: 'grrm',
    createdByUser: 'grrm',
    status: 'closed',
    target: TARGET,
    title: 'Confirm the launch copy',
  },
]

const MENTION_OPTIONS = {
  data: [],
  error: null,
  loading: false,
} as unknown as UserListWithPermissionsHookValue

const CURRENT_USER = {
  displayName: 'George R.R. Martin',
  id: 'grrm',
} as unknown as CurrentUser

const COMMENT_THREAD = {
  breadcrumbs: [],
  commentsCount: 1,
  fieldPath: 'title',
  hasReferencedValue: false,
  parentComment: {
    _createdAt: '2024-01-01T00:00:00.000Z',
    _id: 'comment-1',
    _rev: 'comment-rev',
    _type: 'comment',
    authorId: 'grrm',
    message: [
      {
        _key: 'block-1',
        _type: 'block',
        children: [{_key: 'span-1', _type: 'span', marks: [], text: 'The crop looks good.'}],
        markDefs: [],
        style: 'normal',
      },
    ],
    reactions: [],
    status: 'open',
    target: {
      document: {_ref: 'article-1', _type: 'reference', _weak: true},
      documentType: 'article',
    },
    threadId: 'thread-1',
  },
  replies: [],
  threadId: 'thread-1',
} as unknown as CommentThreadItem

const COMMENTS_CONTEXT = {
  comments: {
    data: {open: [COMMENT_THREAD], resolved: []},
    error: null,
    loading: false,
  },
  documentId: 'article-1',
  documentType: 'article',
  getComment: () => undefined,
  isCreatingDataset: false,
  mentionOptions: MENTION_OPTIONS,
  operation: {
    create: ASYNC_VOID,
    react: ASYNC_VOID,
    remove: ASYNC_VOID,
    update: ASYNC_VOID,
  },
  setStatus: NOOP,
  status: 'open',
} as unknown as CommentsContextValue

const ADDON_DATASET: AddonDatasetContextValue = {
  client: ADDON_CLIENT,
  createAddonDataset: ASYNC_NOOP,
  error: null,
  isCreatingDataset: false,
  ready: true,
}

function navigationValue(state: State): TasksNavigationContextValue {
  return {
    handleCloseTasks: NOOP,
    handleCopyLinkToTask: NOOP,
    handleOpenTasks: NOOP,
    setActiveTab: NOOP,
    setViewMode: NOOP,
    state,
  }
}

function TasksProviders(props: {children: React.ReactNode; data?: TaskDocument[]; state: State}) {
  const {children, data = TASKS, state} = props
  const tasks: TasksContextValue = {
    activeDocument: {documentId: 'article-1', documentType: 'article'},
    data,
    isLoading: false,
    setActiveDocument: NOOP,
  }

  return (
    <CommentsContext.Provider value={COMMENTS_CONTEXT}>
      <AddonDatasetContext.Provider value={ADDON_DATASET}>
        <TasksEnabledContext.Provider value={{enabled: true, mode: 'default'}}>
          <TasksContext.Provider value={tasks}>
            <TasksNavigationContext.Provider value={navigationValue(state)}>
              {children}
            </TasksNavigationContext.Provider>
          </TasksContext.Provider>
        </TasksEnabledContext.Provider>
      </AddonDatasetContext.Provider>
    </CommentsContext.Provider>
  )
}

const LIST_STATE: State = {
  activeTabId: 'document',
  duplicateTaskValues: null,
  isOpen: true,
  selectedTask: null,
  viewMode: 'list',
}

const CREATE_STATE: State = {
  ...LIST_STATE,
  selectedTask: 'task-new',
  viewMode: 'create',
}

const ACTIVE_TOOL_LAYOUT_PROPS = {
  activeTool: {} as ActiveToolLayoutProps['activeTool'],
  renderDefault: () => (
    <Card height="fill" padding={5} tone="transparent">
      <Text size={2}>Active tool content</Text>
    </Card>
  ),
} satisfies ActiveToolLayoutProps

/**
 * Chromatic sentinel for the responsive Tasks shell and sidebar, list sections, and create-form
 * layout. Fixed task data and timestamps keep all viewport captures deterministic.
 */
export function TasksVisualStory() {
  return (
    <TestWrapper schemaTypes={[]} i18nBundles={[tasksUsEnglishLocaleBundle]}>
      <Stack gap={5}>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            responsive task shell and sidebar
          </Text>
          <Box style={{height: 520, position: 'relative'}}>
            <TasksProviders state={LIST_STATE}>
              <TasksStudioActiveToolLayout {...ACTIVE_TOOL_LAYOUT_PROPS} />
            </TasksProviders>
          </Box>
        </Stack>

        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            populated sidebar
          </Text>
          <Box style={{height: 520, maxWidth: 360}}>
            <TasksProviders state={LIST_STATE}>
              <TasksStudioSidebar />
            </TasksProviders>
          </Box>
        </Stack>

        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            open, closed and empty list sections
          </Text>
          <Card border padding={4} style={{maxWidth: 420}}>
            <TasksProviders state={LIST_STATE}>
              <TasksList items={TASKS} onTaskSelect={NOOP} />
              <TasksList items={[]} onTaskSelect={NOOP} />
            </TasksProviders>
          </Card>
        </Stack>

        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            create form
          </Text>
          <Card border padding={4} style={{maxWidth: 520}}>
            <TasksProviders state={CREATE_STATE}>
              <TasksFormBuilder />
            </TasksProviders>
          </Card>
        </Stack>

        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            activity comment
          </Text>
          <Card border padding={4} style={{maxWidth: 520}}>
            <TasksProviders state={LIST_STATE}>
              <TasksActivityCommentItem
                commentId="comment-1"
                currentUser={CURRENT_USER}
                mentionOptions={MENTION_OPTIONS}
                onCreateRetry={NOOP}
                onDelete={NOOP}
                onReply={NOOP}
              />
            </TasksProviders>
          </Card>
        </Stack>

        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            edit form first row
          </Text>
          <Card border style={{maxWidth: 520}}>
            <FormEditRow>
              <Card padding={2}>Open</Card>
              <Card padding={2}>George R.R. Martin</Card>
              <Card padding={2}>No due date</Card>
            </FormEditRow>
          </Card>
        </Stack>
      </Stack>
    </TestWrapper>
  )
}
