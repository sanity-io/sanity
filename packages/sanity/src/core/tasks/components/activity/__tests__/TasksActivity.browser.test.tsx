import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {
  CommentsState,
  FIXED_TIMESTAMP,
  taskDocument,
  TasksVisualHarness,
} from '../../__tests__/taskVisualFixtures'
import {type FieldChange} from '../helpers/parseTransactions'
import {EditedAt} from '../TaskActivityEditedAt'
import {TasksActivityCreatedAt} from '../TasksActivityCreatedAt'
import {TasksActivityLog} from '../TasksActivityLog'

const {settleChromaticEndState} = testHelpers()

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
    </TasksVisualHarness>
  )
}

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
