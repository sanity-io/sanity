/**
 * Shared fixture layer for the collaboration stories (Comments + Tasks).
 *
 * Three jobs:
 *
 * 1. **i18n**: the `comments` and `tasks` locale bundles are registered by their
 *    plugins in a real Studio, so the harness i18next instance (`lib/i18n.ts`,
 *    studio + structure namespaces only) doesn't carry them. We add them to the
 *    already-initialized shared instance via `addResourceBundle` — i18next's
 *    `hasLoadedNamespace` consults the resource store first, so `useTranslation`
 *    in comments/tasks components resolves synchronously with no backend round-trip.
 *
 * 2. **Users**: comment avatars, mention rows and task assignees all resolve users
 *    through the REAL `createUserStore` (DataLoader over `client.request('/users/…')`,
 *    see `packages/sanity/src/core/store/datastores.ts` `useUserStore`). Instead of
 *    faking the store we wrap the standard mock client so `/users/<id,…>` requests are
 *    served from a fixture cast — the store's batching, priming and caching all run
 *    for real.
 *
 * 3. **Fixtures + context values**: deterministic comment threads (open + resolved,
 *    replies, reactions, a mention) and task documents (open/closed, assignees, due
 *    dates). Timestamps are OFFSETS from module-load time — the harness precedent set
 *    by `fixtureReleases` in `lib/testProvider.tsx` — so relative-time labels render
 *    the same on any day ("2 hours ago" stays "2 hours ago") instead of drifting the
 *    way pinned absolute dates would.
 */
import {type SanityClient} from '@sanity/client'
import {type CurrentUser, type PortableTextBlock, type User} from '@sanity/types'
import {useTheme} from '@sanity/ui'
import {type PropsWithChildren, useMemo} from 'react'
import {
  AddonDatasetContext,
  TasksContext,
  TasksEnabledContext,
  TasksNavigationContext,
  UserColorManagerContext,
} from 'sanity/_singletons'

import {commentsLocaleNamespace} from '../../../packages/sanity/src/core/comments/i18n'
import commentsLocaleStrings from '../../../packages/sanity/src/core/comments/i18n/resources'
import {
  type CommentDocument,
  type CommentReactionItem,
  type CommentThreadItem,
} from '../../../packages/sanity/src/core/comments/types'
import {type UserListWithPermissionsHookValue} from '../../../packages/sanity/src/core/hooks/useUserListWithPermissions'
import {
  type SidebarTabsIds,
  type TasksContextValue,
  type TasksNavigationContextValue,
} from '../../../packages/sanity/src/core/tasks/context'
import {tasksLocaleNamespace} from '../../../packages/sanity/src/core/tasks/i18n'
import tasksLocaleStrings from '../../../packages/sanity/src/core/tasks/i18n/resources'
import {type TaskDocument} from '../../../packages/sanity/src/core/tasks/types'
import {createUserColorManager} from '../../../packages/sanity/src/core/user-color/manager'
import {createMockSanityClient} from '../../../packages/sanity/test/mocks/mockSanityClient'
import {i18next} from './i18n'

// The shared instance has already run its (synchronous) init() by the time this
// module executes, so the resource store exists. `deep: false, overwrite: true`.
i18next.addResourceBundle('en-US', commentsLocaleNamespace, commentsLocaleStrings, false, true)
i18next.addResourceBundle('en-US', tasksLocaleNamespace, tasksLocaleStrings, false, true)

const noop = () => undefined

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

/**
 * `doug` mirrors the harness `currentUser` in `lib/testProvider.tsx` — the real
 * `createUserStore` primes the current user, so his lookups never hit the client;
 * everyone else is served by {@link createUserServingClient}.
 */
export const fixtureUsers: User[] = [
  {id: 'doug', displayName: 'Doug'},
  {id: 'ursula', displayName: 'Ursula K. Le Guin'},
  {id: 'octavia', displayName: 'Octavia Butler'},
  {id: 'ted', displayName: 'Ted Chiang'},
]

export const currentUserDoug: CurrentUser = {
  id: 'doug',
  name: 'Doug',
  email: 'doug@sanity.io',
  role: 'admin',
  roles: [{name: 'administrator', title: 'Administrator'}],
}

const usersById = new Map(fixtureUsers.map((user) => [user.id, user]))

/**
 * The standard mock client with `/users/<id>[,<id>…]` requests intercepted and served
 * from {@link fixtureUsers} (the DataLoader in the real user store batches ids into a
 * single comma-joined request). Everything else delegates to the base mock.
 * `withConfig` must return the wrapper — the user store re-configures its client.
 */
export function createUserServingClient(): SanityClient {
  const base = createMockSanityClient()
  const client = {
    ...base,
    withConfig: () => client,
    request: (opts: {uri: string; method?: string}) => {
      const match = /^\/users\/([^?]+)/.exec(opts.uri)
      if (match) {
        const ids = match[1].split(',')
        return Promise.resolve(ids.map((id) => usersById.get(id) ?? null))
      }
      return base.request(opts as never)
    },
  }
  return client as unknown as SanityClient
}

/**
 * Mention candidates for `CommentInput` / `MentionsMenu`. `granted: false` on one row
 * exercises the real "no access" disabled treatment in the mentions list.
 */
export const fixtureMentionOptions: UserListWithPermissionsHookValue = {
  data: [
    {id: 'doug', displayName: 'Doug', granted: true},
    {id: 'ursula', displayName: 'Ursula K. Le Guin', granted: true},
    {id: 'octavia', displayName: 'Octavia Butler', granted: true},
    {id: 'ted', displayName: 'Ted Chiang', granted: false},
  ],
  error: null,
  loading: false,
}

// ---------------------------------------------------------------------------
// Comment fixtures
// ---------------------------------------------------------------------------

const NOW = Date.now()
const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

function agoISO(offsetMs: number): string {
  return new Date(NOW - offsetMs).toISOString()
}

/** A single normal-style Portable Text block, optionally ending in a `@mention`. */
export function ptMessage(text: string, key: string, mentionUserId?: string): PortableTextBlock[] {
  return [
    {
      _type: 'block',
      _key: key,
      style: 'normal',
      markDefs: [],
      children: [
        {_type: 'span', _key: `${key}-s0`, text, marks: []},
        ...(mentionUserId
          ? [
              {_type: 'span', _key: `${key}-s1`, text: ' ', marks: []},
              {_type: 'mention', _key: `${key}-m0`, userId: mentionUserId},
              {_type: 'span', _key: `${key}-s2`, text: '', marks: []},
            ]
          : []),
      ],
    },
  ]
}

interface CommentFixtureOptions {
  id: string
  authorId: string
  message: PortableTextBlock[]
  threadId: string
  fieldPath: string
  createdAgoMs: number
  parentCommentId?: string
  status?: CommentDocument['status']
  reactions?: CommentReactionItem[]
}

export function createFixtureComment(options: CommentFixtureOptions): CommentDocument {
  const {
    id,
    authorId,
    message,
    threadId,
    fieldPath,
    createdAgoMs,
    parentCommentId,
    status = 'open',
    reactions = null,
  } = options
  return {
    _type: 'comment',
    _id: id,
    _rev: `rev-${id}`,
    _createdAt: agoISO(createdAgoMs),
    authorId,
    message,
    threadId,
    parentCommentId,
    status,
    reactions: reactions as CommentDocument['reactions'],
    target: {
      path: {field: fieldPath},
      documentType: 'article',
      document: {_ref: 'article-launch', _type: 'reference', _weak: true},
    },
  }
}

function reaction(
  key: string,
  shortName: CommentReactionItem['shortName'],
  userId: string,
  addedAgoMs: number,
): CommentReactionItem {
  return {_key: key, shortName, userId, addedAt: agoISO(addedAgoMs)}
}

const titleThreadParent = createFixtureComment({
  id: 'comment-title-1',
  authorId: 'ursula',
  message: ptMessage('Shouldn’t the launch date be in the title? "Q3" reads vague.', 'ct1'),
  threadId: 'thread-title',
  fieldPath: 'title',
  createdAgoMs: 3 * HOUR,
  reactions: [
    reaction('r1', ':+1:', 'doug', 2 * HOUR),
    reaction('r2', ':+1:', 'octavia', 90 * MINUTE),
    reaction('r3', ':eyes:', 'ted', 1 * HOUR),
  ],
})

const titleThreadReplies: CommentDocument[] = [
  // CommentsList reverses replies per thread (newest-first storage, oldest-first display).
  createFixtureComment({
    id: 'comment-title-3',
    authorId: 'ursula',
    message: ptMessage('Works for me — handing this to', 'ct3', 'octavia'),
    threadId: 'thread-title',
    fieldPath: 'title',
    parentCommentId: 'comment-title-1',
    createdAgoMs: 1 * HOUR,
  }),
  createFixtureComment({
    id: 'comment-title-2',
    authorId: 'doug',
    message: ptMessage('Agreed. Let’s say "September" explicitly.', 'ct2'),
    threadId: 'thread-title',
    fieldPath: 'title',
    parentCommentId: 'comment-title-1',
    createdAgoMs: 2 * HOUR,
  }),
]

const introThreadParent = createFixtureComment({
  id: 'comment-intro-1',
  authorId: 'octavia',
  message: ptMessage('This paragraph repeats the pricing claim from the hero — cut one.', 'ci1'),
  threadId: 'thread-intro',
  fieldPath: 'body[_key=="intro"].text',
  createdAgoMs: 2 * DAY,
})

/** Two open threads on different fields: one deep (replies + reactions + mention), one bare. */
export const fixtureOpenThreads: CommentThreadItem[] = [
  {
    breadcrumbs: [{invalid: false, title: 'Title'}],
    commentsCount: 1 + titleThreadReplies.length,
    fieldPath: 'title',
    hasReferencedValue: false,
    parentComment: titleThreadParent,
    replies: titleThreadReplies,
    threadId: 'thread-title',
  },
  {
    breadcrumbs: [
      {invalid: false, title: 'Body'},
      {invalid: false, isArrayItem: true, title: 'Intro paragraph'},
    ],
    commentsCount: 1,
    fieldPath: 'body[_key=="intro"].text',
    hasReferencedValue: false,
    parentComment: introThreadParent,
    replies: [],
    threadId: 'thread-intro',
  },
]

export const fixtureResolvedThreads: CommentThreadItem[] = [
  {
    breadcrumbs: [{invalid: false, title: 'Slug'}],
    commentsCount: 2,
    fieldPath: 'slug',
    hasReferencedValue: false,
    parentComment: createFixtureComment({
      id: 'comment-slug-1',
      authorId: 'ted',
      message: ptMessage('Slug still says "draft-2" — intentional?', 'cs1'),
      threadId: 'thread-slug',
      fieldPath: 'slug',
      createdAgoMs: 5 * DAY,
      status: 'resolved',
    }),
    replies: [
      createFixtureComment({
        id: 'comment-slug-2',
        authorId: 'doug',
        message: ptMessage('Good catch — fixed.', 'cs2'),
        threadId: 'thread-slug',
        fieldPath: 'slug',
        parentCommentId: 'comment-slug-1',
        createdAgoMs: 4 * DAY,
        status: 'resolved',
      }),
    ],
    threadId: 'thread-slug',
  },
]

// ---------------------------------------------------------------------------
// Task fixtures
// ---------------------------------------------------------------------------

interface TaskFixtureOptions {
  id: string
  title: string
  status: TaskDocument['status']
  authorId?: string
  assignedTo?: string
  dueBy?: string
  createdAgoMs?: number
  withTarget?: boolean
}

export function createFixtureTask(options: TaskFixtureOptions): TaskDocument {
  const {
    id,
    title,
    status,
    authorId = 'doug',
    assignedTo,
    dueBy,
    createdAgoMs = 2 * DAY,
    withTarget,
  } = options
  return {
    _type: 'tasks.task',
    _id: id,
    _rev: `rev-${id}`,
    _createdAt: agoISO(createdAgoMs),
    _updatedAt: agoISO(createdAgoMs),
    title,
    status,
    authorId,
    assignedTo,
    dueBy,
    target: withTarget
      ? {
          documentType: 'article',
          document: {
            _dataset: 'mock-data-set',
            _projectId: 'mock-project-id',
            _ref: 'article-launch',
            _type: 'crossDatasetReference',
            _weak: true,
          },
        }
      : undefined,
  }
}

/**
 * Due dates: "today" is computed at module load so `TaskDueDate`'s `isToday` branch
 * (red "Today" treatment) renders identically on any day; the other dates are offsets
 * for the same reason.
 */
const dueToday = new Date(NOW).toISOString()
const dueNextWeek = new Date(NOW + 9 * DAY).toISOString()

export const fixtureTasks: TaskDocument[] = [
  createFixtureTask({
    id: 'task-verify-pricing',
    title: 'Verify the pricing table against the launch sheet',
    status: 'open',
    assignedTo: 'ursula',
    dueBy: dueToday,
    withTarget: true,
  }),
  createFixtureTask({
    id: 'task-alt-text',
    title: 'Write alt text for the hero image',
    status: 'open',
    assignedTo: 'octavia',
    dueBy: dueNextWeek,
  }),
  createFixtureTask({
    id: 'task-legal-review',
    title: 'Legal review of the claims section',
    status: 'open',
  }),
  createFixtureTask({
    id: 'task-outline',
    title: 'Outline the launch article',
    status: 'closed',
    assignedTo: 'doug',
    createdAgoMs: 6 * DAY,
  }),
  createFixtureTask({
    id: 'task-interview',
    title: 'Interview the product team',
    status: 'closed',
    assignedTo: 'ted',
    createdAgoMs: 8 * DAY,
  }),
]

// ---------------------------------------------------------------------------
// Tasks context harness
// ---------------------------------------------------------------------------

/**
 * Minimal addon-dataset value whose client resolves `patch().set().commit()` — the
 * `TasksStatus` checkbox runs `useTaskOperations().edit()` against it, so toggling in a
 * story resolves instead of logging "No client" to the console. (The harness default in
 * `lib/testProvider.tsx` seeds `client: null`; this inner provider wins for tasks
 * stories.) Writes go nowhere: the fixture list is static, which the story docs note.
 */
const addonClientStub = {
  patch: () => ({set: () => ({commit: () => Promise.resolve({})})}),
} as unknown as SanityClient

const addonDatasetValue = {
  client: addonClientStub,
  createAddonDataset: () => Promise.resolve(null),
  isCreatingDataset: false,
  ready: true,
  error: null,
}

export interface TasksStoryHarnessProps {
  /** Seeds `useTasks().data`. Defaults to {@link fixtureTasks}. */
  tasks?: TaskDocument[]
  /** Sidebar tab the navigation state reports. Defaults to `assigned`. */
  activeTabId?: SidebarTabsIds
  mode?: 'default' | 'upsell'
}

/**
 * Provides the three tasks singleton contexts (`TasksEnabledContext`, `TasksContext`,
 * `TasksNavigationContext`) plus the addon-dataset override, mirroring what
 * `TasksStudioLayout` + `TasksProvider` + `TasksNavigationProvider` assemble in a real
 * Studio — but value-seeded, so no addon-dataset bootstrap or live listener is needed.
 * Mount inside `WithStudioProviders`.
 */
export function TasksStoryHarness(props: PropsWithChildren<TasksStoryHarnessProps>) {
  const {children, tasks = fixtureTasks, activeTabId = 'assigned', mode = 'default'} = props

  // `UserAvatar` (via `TasksUserAvatar`) reads the user-color manager, whose real
  // provider needs the Studio `ColorSchemeValueContext`; here the manager is created
  // directly from the active theme's scheme (tracks the toolbar theme switcher).
  const dark = useTheme().sanity.color.dark
  const userColorManager = useMemo(
    () => createUserColorManager({scheme: dark ? 'dark' : 'light'}),
    [dark],
  )

  const tasksValue: TasksContextValue = useMemo(
    () => ({activeDocument: null, setActiveDocument: noop, data: tasks, isLoading: false}),
    [tasks],
  )

  const navigationValue: TasksNavigationContextValue = useMemo(
    () => ({
      state: {
        isOpen: true,
        viewMode: 'list',
        selectedTask: null,
        activeTabId,
        duplicateTaskValues: null,
      },
      setActiveTab: noop,
      setViewMode: noop,
      handleCloseTasks: noop,
      handleCopyLinkToTask: noop,
      handleOpenTasks: noop,
    }),
    [activeTabId],
  )

  return (
    <UserColorManagerContext.Provider value={userColorManager}>
      <AddonDatasetContext.Provider value={addonDatasetValue}>
        <TasksEnabledContext.Provider value={{enabled: true, mode}}>
          <TasksContext.Provider value={tasksValue}>
            <TasksNavigationContext.Provider value={navigationValue}>
              {children}
            </TasksNavigationContext.Provider>
          </TasksContext.Provider>
        </TasksEnabledContext.Provider>
      </AddonDatasetContext.Provider>
    </UserColorManagerContext.Provider>
  )
}
