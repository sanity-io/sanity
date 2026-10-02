import {Text} from '@sanity/ui'
import {type ReactNode} from 'react'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {AddonDatasetProvider} from '../../../../studio/addonDataset/AddonDatasetProvider'
import {
  taskDocument,
  TasksState,
  TasksVisualHarness,
  DUE_TIMESTAMP,
} from '../../__tests__/taskVisualFixtures'
import {TasksUserAvatar} from '../../TasksUserAvatar'
import {DocumentPreview} from '../DocumentPreview'
import {EmptyTasksListState} from '../EmptyStates'
import {TasksList} from '../TasksList'
import {TasksListItem} from '../TasksListItem'

const {settleChromaticEndState} = testHelpers()

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

function Block(props: {label: string; children: ReactNode; height?: number}) {
  return (
    <div style={{width: 360, height: props.height}}>
      <Text muted size={0} weight="medium">
        {props.label}
      </Text>
      {props.children}
    </div>
  )
}

function TasksListHarness() {
  return (
    <TasksVisualHarness>
      <AddonDatasetProvider>
        <div style={{display: 'flex', flexDirection: 'column', gap: 24}}>
          <Block label="List">
            <TasksState navigation={{activeTabId: 'assigned'}}>
              <TasksList items={[OPEN_TASK]} onTaskSelect={() => undefined} />
            </TasksState>
          </Block>
          <Block label="Avatars">
            <div style={{display: 'flex', gap: 16, alignItems: 'center'}}>
              <TasksUserAvatar user={{id: 'doug'}} withTooltip />
              <TasksUserAvatar />
            </div>
          </Block>
          <Block label="Document">
            <DocumentPreview documentId="author-1" documentType="author" />
          </Block>
          <Block height={240} label="Empty">
            <TasksState navigation={{activeTabId: 'assigned'}}>
              <EmptyTasksListState />
            </TasksState>
          </Block>
          <Block label="Row">
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
          </Block>
        </div>
      </AddonDatasetProvider>
    </TasksVisualHarness>
  )
}

describe('tasks list', () => {
  test('renders a task row, avatars, a document link, and the empty list', async () => {
    void render(<TasksListHarness />)

    await expect
      .element(page.getByRole('button', {name: 'Proofread the launch notes'}).first())
      .toBeVisible()
    await expect.element(page.getByText('No completed tasks')).toBeVisible()
    await expect.element(page.getByText("You haven't been assigned any tasks")).toBeVisible()
    await expect.element(page.getByText('Jun 15').first()).toBeVisible()
    await expect.poll(() => document.querySelectorAll('[data-ui="Skeleton"]').length).toBe(0)
    await expect.element(page.getByText('Untitled').first()).toBeVisible()
    await settleChromaticEndState()
  })
})
