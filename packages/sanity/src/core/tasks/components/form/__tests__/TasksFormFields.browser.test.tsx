import {type ObjectSchemaType, type StringSchemaType} from '@sanity/types'
import {Text} from '@sanity/ui'
import {createMemoryHistory} from 'history'
import noop from 'lodash-es/noop.js'
import {type ReactNode, useMemo} from 'react'
import {of} from 'rxjs'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {Button} from '../../../../../ui-components/button/Button'
import {type WorkspaceSummary} from '../../../../config/types'
import {FormValueProvider} from '../../../../form/contexts/FormValue'
import {type ObjectFieldProps} from '../../../../form/types/fieldProps'
import {type ObjectInputProps, type StringInputProps} from '../../../../form/types/inputProps'
import {ActiveWorkspaceMatcherProvider} from '../../../../studio/activeWorkspaceMatcher/ActiveWorkspaceMatcherProvider'
import {AddonDatasetProvider} from '../../../../studio/addonDataset/AddonDatasetProvider'
import {useWorkspace} from '../../../../studio/workspace'
import {
  FIXED_TIMESTAMP,
  MentionState,
  taskDocument,
  TasksState,
  TasksVisualHarness,
} from '../../__tests__/taskVisualFixtures'
import {AssigneeCreateFormField} from '../fields/assignee/AssigneeCreateFormField'
import {AssigneeEditFormField} from '../fields/assignee/AssigneeEditFormField'
import {AssigneeSelectionMenu} from '../fields/assignee/AssigneeSelectionMenu'
import {TargetField} from '../fields/TargetField'
import {FormCreate} from '../tasksFormBuilder/FormCreate'

const {settleChromaticEndState} = testHelpers()

const CREATE_TASK = taskDocument({
  _id: 'task-create',
  _createdAt: FIXED_TIMESTAMP,
  _updatedAt: FIXED_TIMESTAMP,
  title: 'Write the launch notes',
  status: 'open',
})

function Section(props: {label: string; children: ReactNode}) {
  return (
    <div style={{width: 360}}>
      <Text muted size={0} weight="medium">
        {props.label}
      </Text>
      {props.children}
    </div>
  )
}

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
    await expect.poll(() => document.querySelectorAll('[data-ui="Skeleton"]').length).toBe(0)
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
