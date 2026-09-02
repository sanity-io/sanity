import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {render} from '@testing-library/react'
import {type ReactNode} from 'react'
import {type Mock, beforeEach, describe, expect, it, vi} from 'vitest'

import {useWorkspace} from '../../../../studio/workspace'
import {type TaskDocument} from '../../../types'
import {TasksCommentsActivity} from './FormEdit'

const theme = buildTheme()

function renderWithTheme(ui: ReactNode) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>)
}

let capturedCommentsProviderProps: Record<string, unknown> | undefined
let capturedCommentsProviderV2Props: Record<string, unknown> | undefined

vi.mock('../../../../comments/context/comments/CommentsProvider', () => ({
  CommentsProvider: (props: Record<string, unknown>) => {
    capturedCommentsProviderProps = props
    return <>{props.children}</>
  },
}))

vi.mock('../../../../comments-v2/context/comments/CommentsProvider', () => ({
  CommentsProvider: (props: Record<string, unknown>) => {
    capturedCommentsProviderV2Props = props
    return <>{props.children}</>
  },
}))

vi.mock('../../activity/TasksActivityLog', () => ({
  TasksActivityLog: () => <div data-testid="tasks-activity-log" />,
}))

vi.mock('../../../../studio/workspace', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useWorkspace: vi.fn(() => ({
    beta: {comments: {v2: false}},
  })),
}))

const mockUseWorkspace = useWorkspace as Mock

const task = {
  _id: 'drafts.task-1',
  _type: 'tasks.task',
  title: 'Task',
  authorId: 'user-1',
} as TaskDocument

describe('TasksCommentsActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedCommentsProviderProps = undefined
    capturedCommentsProviderV2Props = undefined

    mockUseWorkspace.mockReturnValue({
      beta: {comments: {v2: false}},
    })
  })

  describe('beta.comments.v2', () => {
    it('mounts the v1 provider when the flag is off', () => {
      renderWithTheme(<TasksCommentsActivity value={task} onChange={vi.fn()} activityData={[]} />)

      expect(capturedCommentsProviderProps).toEqual(
        expect.objectContaining({
          documentId: 'drafts.task-1',
          documentType: 'tasks.task',
          sortOrder: 'asc',
          type: 'task',
        }),
      )
      expect(capturedCommentsProviderProps).not.toHaveProperty('groupId')
      expect(capturedCommentsProviderProps).not.toHaveProperty('versionId')
      expect(capturedCommentsProviderV2Props).toBeUndefined()
    })

    it('mounts the v2 provider when the flag is on', () => {
      mockUseWorkspace.mockReturnValue({
        beta: {comments: {v2: true}},
      })

      renderWithTheme(<TasksCommentsActivity value={task} onChange={vi.fn()} activityData={[]} />)

      expect(capturedCommentsProviderV2Props).toEqual(
        expect.objectContaining({
          groupId: 'task-1',
          versionId: 'drafts.task-1',
          documentType: 'tasks.task',
          sortOrder: 'asc',
          type: 'task',
        }),
      )
      expect(capturedCommentsProviderV2Props).not.toHaveProperty('documentId')
      expect(capturedCommentsProviderProps).toBeUndefined()
    })
  })
})
