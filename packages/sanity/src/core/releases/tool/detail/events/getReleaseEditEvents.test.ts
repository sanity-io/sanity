import {type SanityClient} from '@sanity/client'
import {type TransactionLogEventWithEffects} from '@sanity/types'
import {TestScheduler} from 'rxjs/testing'
import {afterEach, beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {getTransactionsLogs} from '../../../../store/translog/getTransactionsLogs'
import {type ReleaseDocument} from '../../../store/types'
import {
  type getReleaseEditEvents as getReleaseEditEventsFunction,
  INITIAL_VALUE,
} from './getReleaseEditEvents'

const mockClient = {
  config: vi.fn().mockReturnValue({dataset: 'testDataset'}),
} as unknown as SanityClient

vi.mock('../../../../store/translog/getTransactionsLogs', () => {
  return {
    getTransactionsLogs: vi.fn(),
  }
})
const MOCKED_RELEASE = {
  userId: '',
  _createdAt: '2024-12-05T16:34:59Z',
  _rev: 'mocked-rev',
  name: 'rWBfpXZVj',
  state: 'active',
  _updatedAt: '2024-12-05T17:09:28Z',
  metadata: {
    releaseType: 'undecided',
    description: '',
    title: 'winter drop',
  },
  publishAt: null,
  _id: '_.releases.rWBfpXZVj',
  _type: 'system.release',
  finalDocumentStates: null,
} as unknown as ReleaseDocument

const MOCKED_TRANSACTION_LOGS: TransactionLogEventWithEffects[] = [
  {
    id: 'mocked-rev',
    timestamp: '2024-12-05T17:09:28.325641Z',
    author: 'p8xDvUMxC',
    documentIDs: ['_.releases.rWBfpXZVj'],
    effects: {
      '_.releases.rWBfpXZVj': {
        apply: [
          11,
          3,
          23,
          0,
          12,
          22,
          '7:09:28',
          23,
          19,
          20,
          15,
          10,
          5,
          19,
          1,
          17,
          'undecided',
          'releaseType',
          15,
        ],
        revert: [
          11,
          3,
          23,
          0,
          12,
          22,
          '6:35:11',
          23,
          19,
          20,
          15,
          10,
          5,
          17,
          '2024-12-20T16:35:00.000Z',
          'intendedPublishAt',
          17,
          'scheduled',
          'releaseType',
          15,
        ],
      },
    },
  },
]

const MOCKED_EVENT = {
  type: 'editRelease',
  author: 'p8xDvUMxC',
  origin: 'translog',
  change: {releaseType: 'undecided', intendedPublishDate: undefined},
  id: 'mocked-rev',
  timestamp: '2024-12-05T17:09:28.325641Z',
  releaseName: 'rWBfpXZVj',
}

const mockGetTransactionsLogs = getTransactionsLogs as Mock
const BASE_GET_TRANSACTION_LOGS_PARAMS = {
  effectFormat: 'mendoza',
  fromTransaction: undefined,
  limit: 100,
  reverse: true,
  tag: 'sanity.studio.release.history',
  toTransaction: MOCKED_RELEASE._rev,
} as const

const MOCKED_RELEASES_STATE = {
  state: 'loaded' as const,
  releaseStack: [],
  releases: new Map([[MOCKED_RELEASE._id, MOCKED_RELEASE]]),
}

describe('getReleaseEditEvents()', () => {
  let testScheduler: TestScheduler
  let getReleaseEditEvents: typeof getReleaseEditEventsFunction
  beforeEach(async () => {
    // We need to reset the module and reassign it because it has an internal cache that we need to evict
    vi.resetModules()
    const testModule = await import('./getReleaseEditEvents')
    getReleaseEditEvents = testModule.getReleaseEditEvents

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })
  afterEach(() => {
    vi.resetAllMocks()
  })
  it('should not get the events if release is undefined', () => {
    testScheduler.run(({expectObservable, hot}) => {
      const observeDocument$ = hot('a', {a: undefined})

      const editEvents$ = getReleaseEditEvents({client: mockClient, observeDocument$})

      expectObservable(editEvents$).toBe('(a)', {a: INITIAL_VALUE})
    })
  })
  it('should get and build the release edit events', () => {
    testScheduler.run(({expectObservable, cold, hot}) => {
      const observeDocument$ = hot('a', {a: MOCKED_RELEASE})

      const editEvents$ = getReleaseEditEvents({client: mockClient, observeDocument$})
      const mockResponse$ = cold('-a|', {a: MOCKED_TRANSACTION_LOGS})
      mockGetTransactionsLogs.mockReturnValueOnce(mockResponse$)
      expectObservable(editEvents$).toBe('a-b', {
        a: {editEvents: [], loading: true, error: null},
        b: {editEvents: [MOCKED_EVENT], loading: false, error: null},
      })
    })
    expect(mockGetTransactionsLogs).toHaveBeenCalledWith(
      mockClient,
      MOCKED_RELEASE._id,
      BASE_GET_TRANSACTION_LOGS_PARAMS,
    )
  })
  it('should expand the release edit events transactions if received max', () => {
    testScheduler.run(({expectObservable, cold, hot}) => {
      const observeDocument$ = hot('a', {a: MOCKED_RELEASE})

      const editEvents$ = getReleaseEditEvents({client: mockClient, observeDocument$})
      const mockFirstResponse$ = cold('-a|', {
        a: Array.from({length: 100}).map((_, index) => {
          return {
            ...MOCKED_TRANSACTION_LOGS[0],
            id:
              index === 0
                ? MOCKED_TRANSACTION_LOGS[0].id
                : `${MOCKED_TRANSACTION_LOGS[0].id}-${index + 1}`,
          }
        }),
      })
      const mockSecondResponse$ = cold('-a|', {
        a: Array.from({length: 100}).map((_, index) => {
          return {
            ...MOCKED_TRANSACTION_LOGS[0],
            id: `${MOCKED_TRANSACTION_LOGS[0].id}-${index + 101}`,
          }
        }),
      })
      const mockFinalResponse$ = cold('-a|', {a: MOCKED_TRANSACTION_LOGS})
      mockGetTransactionsLogs
        .mockReturnValueOnce(mockFirstResponse$)
        .mockReturnValueOnce(mockSecondResponse$)
        .mockReturnValueOnce(mockFinalResponse$)
      expectObservable(editEvents$).toBe('a---b', {
        a: {editEvents: [], loading: true, error: null},
        b: {editEvents: [MOCKED_EVENT], loading: false, error: null},
      })
    })
    expect(mockGetTransactionsLogs).toHaveBeenCalledTimes(3)
    expect(mockGetTransactionsLogs).toHaveBeenCalledWith(mockClient, MOCKED_RELEASE._id, {
      ...BASE_GET_TRANSACTION_LOGS_PARAMS,
      toTransaction: MOCKED_RELEASE._rev,
    })
    expect(mockGetTransactionsLogs).toHaveBeenCalledWith(mockClient, MOCKED_RELEASE._id, {
      ...BASE_GET_TRANSACTION_LOGS_PARAMS,
      toTransaction: `${MOCKED_TRANSACTION_LOGS[0].id}-100`,
    })
    expect(mockGetTransactionsLogs).toHaveBeenCalledWith(mockClient, MOCKED_RELEASE._id, {
      ...BASE_GET_TRANSACTION_LOGS_PARAMS,
      toTransaction: `${MOCKED_TRANSACTION_LOGS[0].id}-200`,
    })
  })
  it('should not refetch the edit events if rev has not changed', () => {
    testScheduler.run(({expectObservable, cold, hot}) => {
      // Simulate the release states changing over time, but the _rev is the same
      // 'a' at frame 0: initial state with _rev=rev1
      // 'b' at frame 5: updated state with _rev=rev2
      const observeDocument$ = hot('a---b', {
        a: MOCKED_RELEASE,
        b: MOCKED_RELEASE,
      })
      const editEvents$ = getReleaseEditEvents({client: mockClient, observeDocument$})
      const mockResponse$ = cold('-a|', {a: MOCKED_TRANSACTION_LOGS})
      mockGetTransactionsLogs.mockReturnValueOnce(mockResponse$)
      // Even though the state changes, the editEvents$ should not emit again
      expectObservable(editEvents$).toBe('a-b', {
        a: {editEvents: [], loading: true, error: null},
        b: {editEvents: [MOCKED_EVENT], loading: false, error: null},
      })
    })
    expect(mockGetTransactionsLogs).toHaveBeenCalledWith(
      mockClient,
      MOCKED_RELEASE._id,
      BASE_GET_TRANSACTION_LOGS_PARAMS,
    )
  })
  it('should refetch the edit events if release._rev changes', () => {
    testScheduler.run(({expectObservable, cold, hot}) => {
      // Simulate the release states changing over time
      // 'a' at frame 0: initial state with _rev=rev1
      // 'b' at frame 5: updated state with _rev=rev2
      const observeDocument$ = hot('a---b', {
        a: MOCKED_RELEASE,
        b: {...MOCKED_RELEASE, _rev: 'changed-rev'},
      })

      const editEvents$ = getReleaseEditEvents({client: mockClient, observeDocument$})

      const mockResponse$ = cold('-a|', {a: MOCKED_TRANSACTION_LOGS})
      const newTransaction = {
        id: 'changed-rev',
        timestamp: '2024-12-05T17:10:28.325641Z',
        author: 'p8xDvUMxC',
        documentIDs: ['_.releases.rWBfpXZVj'],
        effects: {},
      }
      // It only returns the new transactions, the rest are from the cache, so they will be persisted.
      const mockResponse2$ = cold('-a|', {a: [newTransaction]})

      mockGetTransactionsLogs.mockReturnValueOnce(mockResponse$).mockReturnValueOnce(mockResponse2$)

      expectObservable(editEvents$).toBe('a-b---c', {
        a: {editEvents: [], loading: true, error: null},
        b: {
          editEvents: [MOCKED_EVENT],
          loading: false,
          error: null,
        },
        c: {
          editEvents: [MOCKED_EVENT],
          loading: false,
          error: null,
        },
      })
    })
    expect(mockGetTransactionsLogs).toHaveBeenCalledWith(
      mockClient,
      MOCKED_RELEASE._id,
      BASE_GET_TRANSACTION_LOGS_PARAMS,
    )
    expect(mockGetTransactionsLogs).toHaveBeenCalledWith(mockClient, MOCKED_RELEASE._id, {
      ...BASE_GET_TRANSACTION_LOGS_PARAMS,
      // Uses the previous release._rev as the fromTransaction
      fromTransaction: MOCKED_RELEASE._rev,
      // Uses the new release._rev as the toTransaction
      toTransaction: 'changed-rev',
    })
  })
})
