import {defineField, defineType, type SchemaTypeDefinition} from '@sanity/types'
import noop from 'lodash-es/noop.js'
import {type ReactNode} from 'react'
import {
  CommentsContext,
  MentionUserContext,
  TasksContext,
  TasksEnabledContext,
  TasksNavigationContext,
} from 'sanity/_singletons'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {type CommentsContextValue} from '../../../comments/context/comments/types'
import {commentsUsEnglishLocaleBundle} from '../../../comments/i18n'
import {
  type UserListWithPermissionsHookValue,
  type UserWithPermission,
} from '../../../hooks/useUserListWithPermissions'
import {LocaleProvider} from '../../../i18n/components/LocaleProvider'
import {type TasksEnabledContextValue} from '../../context/enabled/types'
import {type MentionUserContextValue} from '../../context/mentionUser/types'
import {type State, type TasksNavigationContextValue} from '../../context/navigation/types'
import {type TasksContextValue} from '../../context/tasks/types'
import {tasksUsEnglishLocaleBundle} from '../../i18n'
import {type TaskDocument} from '../../types'

/** Fixed instants so relative-time copy resolves to a calendar date, not "2 years ago". */
export const FIXED_TIMESTAMP = '2020-01-15T12:00:00.000Z'
export const LATER_TIMESTAMP = '2020-02-01T12:00:00.000Z'
/** Far enough ahead that due-date copy stays "Jun 15" rather than "Today". */
export const DUE_TIMESTAMP = '2030-06-15T12:00:00.000Z'

export const AUTHOR_SCHEMA: SchemaTypeDefinition[] = [
  defineType({
    type: 'document',
    name: 'author',
    title: 'Author',
    fields: [defineField({type: 'string', name: 'name', title: 'Name'})],
  }),
]

const I18N_BUNDLES = [tasksUsEnglishLocaleBundle, commentsUsEnglishLocaleBundle]

export const ENABLED_TASKS: TasksEnabledContextValue = {enabled: true, mode: 'default'}

export const MENTION_USERS: UserWithPermission[] = [
  {id: 'ada', displayName: 'Ada Lovelace', email: 'ada@example.com', granted: true},
  {id: 'guest', displayName: 'Guest Editor', email: 'guest@example.com', granted: false},
]

export const MENTION_OPTIONS: UserListWithPermissionsHookValue = {
  data: MENTION_USERS,
  error: null,
  loading: false,
}

export const MENTION_CONTEXT: MentionUserContextValue = {
  mentionOptions: MENTION_OPTIONS,
  selectedDocument: null,
  setSelectedDocument: noop,
}

const asyncNoop = async () => {
  /* fixture */
}

export const COMMENTS_CONTEXT: CommentsContextValue = {
  documentId: 'task-activity',
  documentType: 'tasks.task',
  getComment: () => undefined,
  isCreatingDataset: false,
  comments: {
    data: {open: [], resolved: []},
    error: null,
    loading: false,
  },
  operation: {
    create: asyncNoop,
    remove: asyncNoop,
    update: asyncNoop,
    react: asyncNoop,
  },
  mentionOptions: MENTION_OPTIONS,
  status: 'open',
  setStatus: noop,
}

export function taskDocument(
  overrides: Partial<TaskDocument> & Pick<TaskDocument, '_id' | 'title' | 'status'>,
): TaskDocument {
  return {
    _type: 'tasks.task',
    _createdAt: FIXED_TIMESTAMP,
    _updatedAt: LATER_TIMESTAMP,
    _rev: `rev-${overrides._id}`,
    authorId: 'doug',
    ...overrides,
  }
}

export function tasksContext(data: TaskDocument[]): TasksContextValue {
  return {
    activeDocument: null,
    setActiveDocument: noop,
    data,
    isLoading: false,
  }
}

const NAVIGATION_STATE: State = {
  isOpen: true,
  viewMode: 'list',
  selectedTask: null,
  activeTabId: 'assigned',
  duplicateTaskValues: null,
}

export function navigationContext(state: Partial<State> = {}): TasksNavigationContextValue {
  return {
    state: {...NAVIGATION_STATE, ...state},
    setActiveTab: noop,
    setViewMode: noop,
    handleCloseTasks: noop,
    handleCopyLinkToTask: noop,
    handleOpenTasks: noop,
  }
}

export function TasksVisualHarness(props: {
  children: ReactNode
  schemaTypes?: SchemaTypeDefinition[]
}) {
  const {children, schemaTypes = AUTHOR_SCHEMA} = props
  return (
    <TestWrapper i18nBundles={I18N_BUNDLES} schemaTypes={schemaTypes}>
      <LocaleProvider>{children}</LocaleProvider>
    </TestWrapper>
  )
}

export function TasksState(props: {
  children: ReactNode
  navigation?: Partial<State>
  tasks?: TaskDocument[]
}) {
  const {children, navigation, tasks = []} = props
  return (
    <TasksEnabledContext.Provider value={ENABLED_TASKS}>
      <TasksContext.Provider value={tasksContext(tasks)}>
        <TasksNavigationContext.Provider value={navigationContext(navigation)}>
          {children}
        </TasksNavigationContext.Provider>
      </TasksContext.Provider>
    </TasksEnabledContext.Provider>
  )
}

export function MentionState(props: {children: ReactNode}) {
  return (
    <MentionUserContext.Provider value={MENTION_CONTEXT}>
      {props.children}
    </MentionUserContext.Provider>
  )
}

export function CommentsState(props: {children: ReactNode}) {
  return (
    <CommentsContext.Provider value={COMMENTS_CONTEXT}>{props.children}</CommentsContext.Provider>
  )
}
