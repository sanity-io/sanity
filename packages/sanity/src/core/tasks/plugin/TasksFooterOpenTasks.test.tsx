import {beforeAll, beforeEach, describe, expect, it, jest} from '@jest/globals'
import {LayerProvider, studioTheme, ThemeProvider, useMediaIndex} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {render, screen, waitFor} from '@testing-library/react'
import {act} from 'react'

import {TasksEnabledProvider, TasksNavigationProvider, TasksProvider} from '../context'
import {useTasksStore} from '../store'
import {type TaskDocument} from '../types'
import {SetActiveDocument} from './structure/SetActiveDocument'
import {TasksFooterOpenTasks} from './TasksFooterOpenTasks'

jest.mock('../../hooks/useFeatureEnabled', () => ({
  useFeatureEnabled: jest.fn().mockReturnValue({enabled: true, isLoading: false}),
}))
jest.mock('../../studio/workspace', () => ({
  useWorkspace: jest.fn().mockReturnValue({tasks: {enabled: true}}),
}))
jest.mock('../store', () => ({useTasksStore: jest.fn()}))
jest.mock('../context/isLastPane/useIsLastPane', () => ({
  useIsLastPane: jest.fn().mockReturnValue(true),
}))
jest.mock('@sanity/ui', () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual: typeof import('@sanity/ui') = jest.requireActual('@sanity/ui')
  const useToastMock = jest.fn()
  const useMediaIndexMock = jest.fn()
  return new Proxy(actual, {
    get: (target, property: keyof typeof actual) => {
      if (property === 'useToast') return useToastMock
      if (property === 'useMediaIndex') return useMediaIndexMock
      return target[property]
    },
  })
})
jest.mock('sanity/router', () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual: typeof import('sanity/router') = jest.requireActual('sanity/router')
  const mock = jest.fn().mockReturnValue({asPath: '/', state: {}})
  return new Proxy(actual, {
    get: (target, property: keyof typeof actual) => {
      if (property === 'useRouter') return mock
      return target[property]
    },
  })
})

const mockUseMediaIndex = useMediaIndex as jest.Mock
const mockUseTasksStore = useTasksStore as jest.Mock<typeof useTasksStore>

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
      dispatch: jest.fn(),
    })
    mockUseMediaIndex.mockReturnValue(mediaIndex)
  }
  beforeAll(() => {
    jest.useFakeTimers()
  })
  beforeEach(() => {
    jest.clearAllMocks()
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
      jest.advanceTimersByTime(1000)
    })
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })
  it('should not render the button if it has tasks and no active document', async () => {
    setUpMocks({tasks: [createTaskMock({targetDocumentId: 'doc1'})]})
    const {container} = render(<TasksFooterOpenTasks />, {wrapper})

    act(() => {
      jest.advanceTimersByTime(1000)
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
      jest.advanceTimersByTime(1000)
    })
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
    })
  })
})
