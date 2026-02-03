import {type SanityClient} from '@sanity/client'
import {of} from 'rxjs'
import {TestScheduler} from 'rxjs/testing'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {addEventData, getReleaseActivityEvents, INITIAL_VALUE} from './getReleaseActivityEvents'
import {type ReleaseEvent} from './types'

const mockObservableRequest = vi.fn()

const mockClient = {
  observable: {
    request: mockObservableRequest,
  },
  config: vi.fn().mockReturnValue({dataset: 'testDataset'}),
} as unknown as SanityClient

const creationEvent: Omit<ReleaseEvent, 'id' | 'origin'> = {
  timestamp: '2024-12-03T00:00:00Z',
  type: 'createRelease',
  releaseName: 'r123',
  author: 'user-1',
}
const addFirstDocumentEvent: Omit<ReleaseEvent, 'id' | 'origin'> = {
  timestamp: '2024-12-03T01:00:00Z',
  type: 'addDocumentToRelease',
  releaseName: 'r123',
  author: 'user-1',
}
const addSecondDocumentEvent: Omit<ReleaseEvent, 'id' | 'origin'> = {
  timestamp: '2024-12-03T02:00:00Z',
  type: 'addDocumentToRelease',
  releaseName: 'r123',
  author: 'user-2',
}

const releaseId = '_.releases.r123'
describe('getReleaseActivityEvents', () => {
  let testScheduler: TestScheduler

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  it('should fetch initial events from the API', () => {
    mockObservableRequest.mockReturnValueOnce(
      of({
        events: [creationEvent, addFirstDocumentEvent],
        nextCursor: 'cursor1',
      }),
    )

    const {events$} = getReleaseActivityEvents({client: mockClient, releaseId})
    testScheduler.run(({expectObservable}) => {
      expectObservable(events$).toBe('(ab)', {
        a: INITIAL_VALUE,
        b: {
          events: [addEventData(addFirstDocumentEvent), addEventData(creationEvent)],
          nextCursor: 'cursor1',
          loading: false,
          error: null,
        },
      })
    })
  })

  it('should reload events when reloadEvents is called', () => {
    mockObservableRequest
      .mockReturnValueOnce(
        of({
          events: [creationEvent, addFirstDocumentEvent],
          nextCursor: 'cursor1',
        }),
      )
      .mockReturnValueOnce(
        of({
          events: [addFirstDocumentEvent, addSecondDocumentEvent],
          // This cursor won't be added, is a reload action we need to keep the previous. Reloads usually load less elements
          nextCursor: 'cursor2',
        }),
      )

    const {events$, reloadEvents} = getReleaseActivityEvents({client: mockClient, releaseId})

    testScheduler.run(({expectObservable, cold}) => {
      const actions = cold('5ms a', {
        a: reloadEvents,
      })

      actions.subscribe((action) => action())

      expectObservable(events$).toBe('(ab)-(cd)', {
        a: INITIAL_VALUE,
        b: {
          events: [addEventData(addFirstDocumentEvent), addEventData(creationEvent)],
          nextCursor: 'cursor1',
          loading: false,
          error: null,
        },
        c: {
          events: [addEventData(addFirstDocumentEvent), addEventData(creationEvent)],
          nextCursor: 'cursor1',
          // Emits a loading state
          loading: true,
          error: null,
        },
        d: {
          events: [
            addEventData(addSecondDocumentEvent),
            addEventData(addFirstDocumentEvent),
            addEventData(creationEvent),
          ],
          // Preserves previous cursor
          nextCursor: 'cursor1',
          loading: false,
          error: null,
        },
      })
    })
  })

  it('should fetch additional events when loadMore is called', () => {
    // It returns the first two events and then it loads an older one
    mockObservableRequest
      .mockReturnValueOnce(
        of({
          events: [addFirstDocumentEvent, addSecondDocumentEvent],
          nextCursor: 'cursor2',
        }),
      )
      .mockReturnValueOnce(
        of({
          events: [creationEvent],
          nextCursor: '',
        }),
      )

    const {events$, loadMore} = getReleaseActivityEvents({client: mockClient, releaseId})

    testScheduler.run(({expectObservable, cold}) => {
      const actions = cold('5ms a', {
        a: loadMore,
      })

      actions.subscribe((action) => action())
      expectObservable(events$).toBe('(ab)-(cd)', {
        a: INITIAL_VALUE,
        b: {
          loading: false,
          nextCursor: 'cursor2',
          error: null,
          events: [addEventData(addSecondDocumentEvent), addEventData(addFirstDocumentEvent)],
        },
        c: {
          loading: true,
          // Given it's a loadMore action, we don't need to keep the previous cursor
          nextCursor: '',
          error: null,
          events: [addEventData(addSecondDocumentEvent), addEventData(addFirstDocumentEvent)],
        },
        d: {
          loading: false,
          nextCursor: '',
          error: null,
          events: [
            addEventData(addSecondDocumentEvent),
            addEventData(addFirstDocumentEvent),
            addEventData(creationEvent),
          ],
        },
      })
    })
  })
})
