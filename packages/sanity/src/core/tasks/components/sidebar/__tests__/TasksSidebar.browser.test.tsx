import {Text} from '@sanity/ui'
import {type ReactNode} from 'react'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {taskDocument, TasksState, TasksVisualHarness} from '../../__tests__/taskVisualFixtures'
import {TasksActiveTabNavigation} from '../TasksActiveTabNavigation'
import {TasksHeaderDraftsMenu} from '../TasksHeaderDraftsMenu'
import {TasksListTabs} from '../TasksListTabs'
import {TasksSidebarHeader} from '../TasksSidebarHeader'

const {settleChromaticEndState} = testHelpers()

const OPEN_TASKS = [
  taskDocument({_id: 'task-1', title: 'First open task', status: 'open'}),
  taskDocument({_id: 'task-2', title: 'Second open task', status: 'open'}),
  taskDocument({_id: 'task-3', title: 'Third open task', status: 'open'}),
]

const DRAFT = taskDocument({_id: 'task-draft', title: 'Homepage refresh', status: 'open'})

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
