import {type ObjectSchemaType, type StringSchemaType} from '@sanity/types'
import {Text} from '@sanity/ui'
import {createMemoryHistory} from 'history'
import noop from 'lodash-es/noop.js'
import {type ReactNode, useMemo} from 'react'
import {of} from 'rxjs'
import {describe, expect, test, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, server} from 'vitest/browser'

import {testHelpers} from '../../../../../test/browser/testHelpers'
import {Button} from '../../../../ui-components/button/Button'
import {type WorkspaceSummary} from '../../../config/types'
import {FormValueProvider} from '../../../form/contexts/FormValue'
import {type ObjectFieldProps} from '../../../form/types/fieldProps'
import {type ObjectInputProps, type StringInputProps} from '../../../form/types/inputProps'
import {ActiveWorkspaceMatcherProvider} from '../../../studio/activeWorkspaceMatcher/ActiveWorkspaceMatcherProvider'
import {AddonDatasetProvider} from '../../../studio/addonDataset/AddonDatasetProvider'
import {useWorkspace} from '../../../studio/workspace'
import {type FieldChange} from '../activity/helpers/parseTransactions'
import {EditedAt} from '../activity/TaskActivityEditedAt'
import {TasksActivityCreatedAt} from '../activity/TasksActivityCreatedAt'
import {TasksActivityLog} from '../activity/TasksActivityLog'
import {AssigneeCreateFormField} from '../form/fields/assignee/AssigneeCreateFormField'
import {AssigneeEditFormField} from '../form/fields/assignee/AssigneeEditFormField'
import {AssigneeSelectionMenu} from '../form/fields/assignee/AssigneeSelectionMenu'
import {TargetField} from '../form/fields/TargetField'
import {FormCreate} from '../form/tasksFormBuilder/FormCreate'
import {DocumentPreview} from '../list/DocumentPreview'
import {EmptyTasksListState} from '../list/EmptyStates'
import {TasksList} from '../list/TasksList'
import {TasksListItem} from '../list/TasksListItem'
import {TasksActiveTabNavigation} from '../sidebar/TasksActiveTabNavigation'
import {TasksHeaderDraftsMenu} from '../sidebar/TasksHeaderDraftsMenu'
import {TasksListTabs} from '../sidebar/TasksListTabs'
import {TasksSidebarHeader} from '../sidebar/TasksSidebarHeader'
import {TasksUserAvatar} from '../TasksUserAvatar'
import {
  CommentsState,
  DUE_TIMESTAMP,
  FIXED_TIMESTAMP,
  MentionState,
  taskDocument,
  TasksState,
  TasksVisualHarness,
} from './taskVisualFixtures'

// The CI chromium runner closes the page once the browser suite grows past about 70 files, so the
// task surfaces share one file instead of one per component folder.

const {settleChromaticEndState} = testHelpers()

vi.mock('../../hooks/useDocumentPreviewValues', () => ({
  useDocumentPreviewValues: () => ({
    isLoading: false,
    value: {title: 'Ada Lovelace'},
  }),
}))

function Section(props: {label: string; children: ReactNode; height?: number}) {
  return (
    <div style={{width: 360, height: props.height}}>
      <Text muted size={0} weight="medium">
        {props.label}
      </Text>
      {props.children}
    </div>
  )
}

const OPEN_TASK = taskDocument({
  _id: 'task-open',
  title: 'Proofread the launch notes',
  status: 'open',
  assignedTo: 'doug',
  dueBy: DUE_TIMESTAMP,
  target: {
    documentType: 'author',
    document: {
      _dataset: 'test',
      _projectId: 'test',
      _ref: 'author-1',
      _type: 'crossDatasetReference',
      _weak: true,
    },
  },
})

function TasksListHarness() {
  return (
    <TasksVisualHarness>
      <AddonDatasetProvider>
        <div style={{display: 'flex', flexDirection: 'column', gap: 24}}>
          <Section label="List">
            <TasksState navigation={{activeTabId: 'assigned'}}>
              <TasksList items={[OPEN_TASK]} onTaskSelect={() => undefined} />
            </TasksState>
          </Section>
          <Section label="Avatars">
            <div style={{display: 'flex', gap: 16, alignItems: 'center'}}>
              <TasksUserAvatar user={{id: 'doug'}} withTooltip />
              <TasksUserAvatar />
            </div>
          </Section>
          <Section label="Document">
            <DocumentPreview documentId="author-1" documentType="author" />
          </Section>
          <Section height={240} label="Empty">
            <TasksState navigation={{activeTabId: 'assigned'}}>
              <EmptyTasksListState />
            </TasksState>
          </Section>
          <Section label="Row">
            <AddonDatasetProvider>
              <TasksListItem
                assignedTo="doug"
                documentId={OPEN_TASK._id}
                dueBy={OPEN_TASK.dueBy}
                onSelect={() => undefined}
                status="open"
                target={OPEN_TASK.target}
                title={OPEN_TASK.title}
              />
            </AddonDatasetProvider>
          </Section>
        </div>
      </AddonDatasetProvider>
    </TasksVisualHarness>
  )
}

const OPEN_TASKS = [
  taskDocument({_id: 'task-1', title: 'First open task', status: 'open'}),
  taskDocument({_id: 'task-2', title: 'Second open task', status: 'open'}),
  taskDocument({_id: 'task-3', title: 'Third open task', status: 'open'}),
]

const DRAFT = taskDocument({_id: 'task-draft', title: 'Homepage refresh', status: 'open'})

function TasksSidebarHarness() {
  return (
    <TasksVisualHarness schemaTypes={[]}>
      <div style={{display: 'flex', flexDirection: 'column', gap: 24}}>
        <Section label="Tabs">
          <TasksState>
            <TasksListTabs activeTabId="subscribed" onChange={() => undefined} />
          </TasksState>
        </Section>
        <Section label="List">
          <TasksState navigation={{viewMode: 'list', activeTabId: 'assigned'}}>
            <TasksSidebarHeader items={OPEN_TASKS} />
          </TasksState>
        </Section>
        <Section label="Edit">
          <TasksState
            navigation={{viewMode: 'edit', selectedTask: 'task-2', activeTabId: 'assigned'}}
          >
            <TasksSidebarHeader items={OPEN_TASKS} />
            <TasksActiveTabNavigation items={OPEN_TASKS} />
          </TasksState>
        </Section>
        <Section label="Create">
          <TasksState navigation={{viewMode: 'create', selectedTask: 'task-new'}} tasks={[DRAFT]}>
            <TasksSidebarHeader items={[]} />
          </TasksState>
        </Section>
      </div>
    </TasksVisualHarness>
  )
}

function TasksDraftsMenuHarness() {
  return (
    <TasksVisualHarness schemaTypes={[]}>
      <div style={{width: 320, paddingBottom: 280}}>
        <TasksState navigation={{viewMode: 'draft', selectedTask: DRAFT._id}} tasks={[DRAFT]}>
          <TasksHeaderDraftsMenu />
        </TasksState>
      </div>
    </TasksVisualHarness>
  )
}

const CREATE_TASK = taskDocument({
  _id: 'task-create',
  _createdAt: FIXED_TIMESTAMP,
  _updatedAt: FIXED_TIMESTAMP,
  title: 'Write the launch notes',
  status: 'open',
})

function TargetWorkspaceBridge(props: {children: ReactNode}) {
  const workspace = useWorkspace()
  const rootSource = workspace.unstable_sources[0]
  const history = useMemo(() => createMemoryHistory({initialEntries: ['/']}), [])
  const activeWorkspace = useMemo(
    () =>
      ({
        type: 'workspace-summary',
        name: workspace.name,
        title: workspace.title,
        icon: workspace.icon,
        customIcon: false,
        basePath: workspace.basePath,
        auth: workspace.auth,
        projectId: workspace.projectId,
        dataset: workspace.dataset,
        apiHost: workspace.apiHost,
        schema: workspace.schema,
        i18n: workspace.i18n,
        comments: {v2: false},
        tasks: {enabled: true},
        scheduledDrafts: {enabled: false},
        variants: {enabled: false},
        scheduledPublishing: {enabled: false},
        releases: {enabled: false},
        __internal: {
          sources: [
            {
              name: rootSource.name,
              projectId: rootSource.projectId,
              dataset: rootSource.dataset,
              title: rootSource.title,
              auth: rootSource.auth,
              schema: rootSource.schema,
              i18n: rootSource.i18n,
              source: of(rootSource),
            },
          ],
        },
      }) as unknown as WorkspaceSummary,
    [rootSource, workspace],
  )

  return (
    <ActiveWorkspaceMatcherProvider
      activeWorkspace={activeWorkspace}
      history={history}
      setActiveWorkspace={noop}
    >
      {props.children}
    </ActiveWorkspaceMatcherProvider>
  )
}

const TARGET_PROPS = {
  mode: 'create',
  title: 'Target',
  description: 'Link this task to a document',
  inputId: 'field-target',
  name: 'target',
  path: ['target'],
  level: 0,
  index: 0,
  changed: false,
  changedFromBaseVariant: false,
  presence: [],
  validation: [],
  value: undefined,
  children: null,
  onCollapse: noop,
  onExpand: noop,
  open: false,
  onClose: noop,
  onOpen: noop,
  renderDefault: () => null,
  schemaType: {jsonType: 'object', name: 'target'} as ObjectSchemaType,
  inputProps: {
    onChange: noop,
    path: ['target'],
    value: undefined,
    schemaType: {jsonType: 'object', name: 'target'} as ObjectSchemaType,
    renderDefault: () => null,
  },
} as unknown as ObjectFieldProps & {mode: 'create'}

function assigneeProps(value: string | undefined): StringInputProps {
  return {
    id: 'assignedTo',
    onChange: noop,
    path: ['assignedTo'],
    renderDefault: () => null,
    schemaType: {jsonType: 'string', name: 'assignedTo'} as StringSchemaType,
    value,
  } as unknown as StringInputProps
}

const FORM_PROPS = {
  id: CREATE_TASK._id,
  onChange: noop,
  path: [],
  renderDefault: () => (
    <Text size={2} weight="semibold">
      {CREATE_TASK.title}
    </Text>
  ),
  schemaType: {jsonType: 'object', name: 'tasks.task'} as ObjectSchemaType,
  value: CREATE_TASK,
} as unknown as ObjectInputProps

function TasksFormFieldsHarness() {
  return (
    <TasksVisualHarness schemaTypes={[]}>
      <MentionState>
        <div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
          <Section label="Target">
            <TargetWorkspaceBridge>
              <TargetField {...TARGET_PROPS} />
            </TargetWorkspaceBridge>
          </Section>
          <Section label="Assignee, create">
            <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
              <AssigneeCreateFormField {...assigneeProps(undefined)} />
              <AssigneeCreateFormField {...assigneeProps('ada')} />
              <AssigneeCreateFormField {...assigneeProps('guest')} />
            </div>
          </Section>
          <Section label="Assignee, edit">
            <FormValueProvider
              value={{_id: 'task-edit', _type: 'tasks.task', subscribers: ['doug']}}
            >
              <div
                style={{display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start'}}
              >
                <AssigneeEditFormField onChange={noop} path={['assignedTo']} value={undefined} />
                <AssigneeEditFormField onChange={noop} path={['assignedTo']} value="ada" />
                <AssigneeEditFormField onChange={noop} path={['assignedTo']} value="guest" />
              </div>
            </FormValueProvider>
          </Section>
          <Section label="Create footer">
            <AddonDatasetProvider>
              <TasksState>
                <FormCreate {...FORM_PROPS} />
              </TasksState>
            </AddonDatasetProvider>
          </Section>
        </div>
      </MentionState>
    </TasksVisualHarness>
  )
}

function AssigneeMenuHarness() {
  return (
    <TasksVisualHarness schemaTypes={[]}>
      <MentionState>
        <div style={{width: 360, paddingBottom: 360}}>
          <AssigneeSelectionMenu
            menuButton={<Button mode="ghost" text="Change assignee" />}
            onSelect={noop}
            value="ada"
          />
        </div>
      </MentionState>
    </TasksVisualHarness>
  )
}

const STATUS_CHANGE: FieldChange = {
  field: 'status',
  from: undefined,
  to: 'open',
  timestamp: FIXED_TIMESTAMP,
  author: 'doug',
}

const ACTIVITY_TASK = taskDocument({
  _id: 'task-activity',
  title: 'Review the homepage',
  status: 'open',
  authorId: 'doug',
  createdByUser: FIXED_TIMESTAMP,
  subscribers: [],
})

function TasksActivityHarness() {
  return (
    <TasksVisualHarness schemaTypes={[]}>
      <TasksState>
        <CommentsState>
          <div style={{display: 'flex', flexDirection: 'column', gap: 24, width: 480}}>
            <TasksActivityCreatedAt authorId="doug" createdAt={FIXED_TIMESTAMP} />
            <EditedAt activity={STATUS_CHANGE} />
            <TasksActivityLog
              activityData={[STATUS_CHANGE]}
              onChange={() => undefined}
              value={ACTIVITY_TASK}
            />
          </div>
        </CommentsState>
      </TasksState>
    </TasksVisualHarness>
  )
}

describe('tasks list', () => {
  test('renders a task row, avatars, a document link, and the empty list', async () => {
    void render(<TasksListHarness />)

    await expect
      .element(page.getByRole('button', {name: 'Proofread the launch notes'}).first())
      .toBeVisible()
    await page.getByText('Done', {exact: true}).click()
    await expect.element(page.getByText('No completed tasks')).toBeVisible()
    await expect.element(page.getByText("You haven't been assigned any tasks")).toBeVisible()
    await expect.element(page.getByText('Jun 15').first()).toBeVisible()
    await expect.poll(() => document.querySelectorAll('[data-ui="Skeleton"]').length).toBe(0)
    await expect.element(page.getByText('Ada Lovelace').first()).toBeVisible()
    await settleChromaticEndState()
  })
})

describe('tasks sidebar', () => {
  test('renders tabs, list, edit, and create headers', async () => {
    void render(<TasksSidebarHarness />)

    await expect.element(page.getByRole('tab', {name: 'Subscribed'})).toBeVisible()
    await expect.element(page.getByRole('button', {name: 'New task'})).toBeVisible()
    await expect.element(page.getByText('2 / 3').first()).toBeVisible()
    await expect.element(page.getByRole('button', {name: 'Draft'})).toBeVisible()
    await settleChromaticEndState()
  })

  test('renders the drafts menu open on the selected draft', async () => {
    void render(<TasksDraftsMenuHarness />)

    await page.getByRole('button', {name: 'Draft'}).click()
    await expect.element(page.getByRole('menuitem', {name: 'Homepage refresh'})).toBeVisible()
    await settleChromaticEndState()
  })
})

describe('tasks form fields', () => {
  test('renders target, assignee, and create-footer states', async () => {
    void render(<TasksFormFieldsHarness />)

    await expect.element(page.getByText('Select target document')).toBeVisible()
    await expect.element(page.getByText('Select assignee')).toBeVisible()
    await expect.element(page.getByText('Ada Lovelace').first()).toBeVisible()
    await expect.element(page.getByText('Unauthorized').first()).toBeVisible()
    await expect.element(page.getByText('Unassigned')).toBeVisible()
    await expect.element(page.getByRole('button', {name: 'Create Task'})).toBeVisible()
    await expect.element(page.getByText('Create more')).toBeVisible()
    // The user store batches lookups on `requestAnimationFrame`, which Firefox and WebKit throttle
    // in a backgrounded test page. Chromatic archives chromium only, where the frames run.
    if (server.browser === 'chromium') {
      await expect.poll(() => document.querySelectorAll('[data-ui="Skeleton"]').length).toBe(0)
    }
    await settleChromaticEndState()
  })

  test('renders the assignee menu open', async () => {
    void render(<AssigneeMenuHarness />)

    await page.getByRole('button', {name: 'Change assignee'}).click()
    await expect.element(page.getByText('No assignee')).toBeVisible()
    await expect.element(page.getByText('Ada Lovelace')).toBeVisible()
    await expect.element(page.getByText('Guest Editor')).toBeVisible()
    await expect.element(page.getByText('Unauthorized')).toBeVisible()
    await settleChromaticEndState()
  })
})

describe('tasks activity', () => {
  test('renders created, edited, and the activity feed', async () => {
    void render(<TasksActivityHarness />)

    await expect.element(page.getByText('Activity')).toBeVisible()
    await expect.element(page.getByRole('button', {name: 'Subscribe'})).toBeVisible()
    await expect.element(page.getByText('created this task').first()).toBeVisible()
    await expect.element(page.getByText('changed status to').first()).toBeVisible()
    await expect.element(page.getByText('To Do').first()).toBeVisible()
    await expect.element(page.getByText('Jan 15, 2020').first()).toBeVisible()
    await expect.element(page.getByText('Doug').first()).toBeVisible()
    await expect.element(page.getByText('Add a comment...')).toBeVisible()
    await expect.poll(() => document.querySelectorAll('[data-ui="Skeleton"]').length).toBe(0)
    await settleChromaticEndState()
  })
})
