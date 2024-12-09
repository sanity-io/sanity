import {LayerProvider, studioTheme, ThemeProvider, useMediaIndex} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {render, screen} from '@testing-library/react'
import {act} from 'react'
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

import {TasksEnabledProvider, TasksNavigationProvider, TasksProvider} from '../context'
import {useTasksStore} from '../store'
import {type TaskDocument} from '../types'
import {SetActiveDocument} from './structure/SetActiveDocument'
import {TasksFooterOpenTasks} from './TasksFooterOpenTasks'

vi.mock('../../hooks/useFeatureEnabled', () => ({
  useFeatureEnabled: vi.fn().mockReturnValue({enabled: true, isLoading: false}),
}))
vi.mock('../../studio/workspace', () => ({
  useWorkspace: vi.fn().mockReturnValue({tasks: {enabled: true}}),
}))
vi.mock('../store', () => ({useTasksStore: vi.fn()}))
vi.mock('../context/isLastPane/useIsLastPane', () => ({
  useIsLastPane: vi.fn().mockReturnValue(true),
}))
vi.mock('@sanity/ui', async () => {
  const actual = await vi.importActual('@sanity/ui')
  const useToastMock = vi.fn()
  const useMediaIndexMock = vi.fn()
  return new Proxy(actual, {
    get: (target, property: keyof typeof actual) => {
      if (property === 'useToast') return useToastMock
      if (property === 'useMediaIndex') return useMediaIndexMock
      return target[property]
    },
  })
})
vi.mock('sanity/router', async () => {
  const actual = await vi.importActual('sanity/router')
  const mock = vi.fn().mockReturnValue({asPath: '/', state: {}})
  return new Proxy(actual, {
    get: (target, property: keyof typeof actual) => {
      if (property === 'useRouter') return mock
      return target[property]
    },
  })
})

const mockUseMediaIndex = useMediaIndex as ReturnType<typeof vi.fn>
const mockUseTasksStore = useTasksStore as ReturnType<typeof vi.fn>

const createTaskMock = ({
  targetDocumentId,
  status = 'open',
  title = 'Test task',
}: {
  targetDocumentId?: string
  status?: TaskDocument['status']
  title?: string
}): TaskDocument => ({
  _type: 'tasks.task',
  _rev: uuid(),
  _updatedAt: '2024-05-15T08:11:18Z',
  _createdAt: '2024-05-15T08:08:26Z',
  _id: uuid(),
  createdByUser: '2024-05-15T08:11:21.103Z',
  authorId: 'author1',
  target: targetDocumentId
    ? {
        documentType: 'author',
        document: {
          _type: 'crossDatasetReference',
          _dataset: 'test',
          _projectId: 'ppsg7ml5',
          _weak: true,
          _ref: targetDocumentId,
        },
      }
    : undefined,
  title,
  status,
})

describe('TasksFooterOpenTasks', () => {
  const wrapper = ({children}: {children?: React.ReactNode}) => {
    return (
      <ThemeProvider theme={studioTheme}>
        <LayerProvider>
          <TasksEnabledProvider>
            <TasksProvider>
              <TasksNavigationProvider>{children}</TasksNavigationProvider>
            </TasksProvider>
          </TasksEnabledProvider>
        </LayerProvider>
      </ThemeProvider>
    )
  }

  const setUpMocks = ({
    tasks = [],
    mediaIndex = 3,
  }: {
    tasks?: TaskDocument[]
    mediaIndex?: number
  }) => {
    mockUseTasksStore.mockReturnValue({
      data: tasks,
      error: null,
      isLoading: false,
      dispatch: vi.fn(),
    })
    mockUseMediaIndex.mockReturnValue(mediaIndex)
  }
  beforeAll(() => {
    vi.useFakeTimers()
  })
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders null if there are no pending tasks', () => {
    setUpMocks({tasks: []})
    const {container} = render(<TasksFooterOpenTasks />, {wrapper})
    expect(container).toBeEmptyDOMElement()
  })
  it('renders the button if it has tasks and an active document', async () => {
    setUpMocks({tasks: [createTaskMock({targetDocumentId: 'doc1'})]})
    render(
      <>
        <TasksFooterOpenTasks />
        <SetActiveDocument documentId="doc1" documentType="author" />
      </>,
      {wrapper},
    )

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
  it('should not render the button if it has tasks and no active document', async () => {
    setUpMocks({tasks: [createTaskMock({targetDocumentId: 'doc1'})]})
    const {container} = render(<TasksFooterOpenTasks />, {wrapper})

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(container).toBeEmptyDOMElement()
  })

  it('renders button with badge when mediaIndex is less than 3', async () => {
    setUpMocks({tasks: [createTaskMock({targetDocumentId: 'doc1'})], mediaIndex: 2})
    render(
      <>
        <TasksFooterOpenTasks />
        <SetActiveDocument documentId="doc1" documentType="author" />
      </>,
      {wrapper},
    )

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByTestId('tasks-badge')).toBeInTheDocument()
  })
})
