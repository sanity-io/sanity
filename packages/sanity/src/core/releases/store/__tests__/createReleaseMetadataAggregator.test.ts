import {type SanityClient} from '@sanity/client'
import {catchError, firstValueFrom, Observable, of, Subject, take, toArray} from 'rxjs'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createReleaseMetadataAggregator} from '../createReleaseMetadataAggregator'

describe('createReleaseMetadataAggregator', () => {
  const mockClient = {
    observable: {
      fetch: vi.fn(),
      listen: vi.fn(),
    },
  } as unknown as SanityClient & {
    observable: {
      fetch: Mock<SanityClient['observable']['fetch']>
      listen: Mock<SanityClient['observable']['listen']>
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockClient.observable.listen.mockReturnValue(new Subject())
  })

  it('should emit empty state when no release ids provided', async () => {
    const result = await firstValueFrom(createReleaseMetadataAggregator(mockClient)([]))
    expect(result).toEqual({data: null, error: null, loading: false})
  })

  it('should emit metadata for releases with loading states', async () => {
    mockClient.observable.fetch.mockReturnValue(
      of({
        ms: 0,
        result: {
          '_.releases.release-1': {
            updatedAt: '2024-01-01T00:00:00Z',
            documentCount: 1,
          },
        },
      }),
    )

    const values = await createReleaseMetadataAggregator(mockClient)(['_.releases.release-1'])
      .pipe(take(2), toArray())
      .toPromise()

    expect(values).toEqual([
      {loading: true, data: null, error: null},
      {
        loading: false,
        error: null,
        data: {
          ms: {documentCount: 0},
          result: {
            '_.releases.release-1': {
              updatedAt: '2024-01-01T00:00:00Z',
              documentCount: 1,
            },
            'documentCount': 0,
          },
        },
      },
    ])
  })

  it('should handle fetch errors with loading states', async () => {
    const error = new Error('Fetch failed')
    mockClient.observable.fetch.mockReturnValue(
      new Observable((subscriber) => subscriber.error(error)),
    )

    const values = await createReleaseMetadataAggregator(mockClient)(['_.releases.release-1'])
      .pipe(
        take(2),
        toArray(),
        catchError((err) =>
          of([
            {loading: true, data: null, error: null},
            {loading: false, data: null, error: err},
          ]),
        ),
      )
      .toPromise()

    expect(values).toEqual([
      {loading: true, data: null, error: null},
      {loading: false, data: null, error},
    ])
  })

  it('should handle null client', async () => {
    const result = await firstValueFrom(
      createReleaseMetadataAggregator(null)(['_.releases.release-1']),
    )
    expect(result).toEqual({data: null, error: null, loading: false})
  })

  it('should fetch metadata for multiple releases', async () => {
    mockClient.observable.fetch.mockReturnValue(
      of({
        ms: 0,
        result: {
          '_.releases.release-1': {updatedAt: '2024-01-01T00:00:00Z', documentCount: 1},
          '_.releases.release-2': {updatedAt: '2024-01-02T00:00:00Z', documentCount: 2},
        },
      }),
    )

    const values: any[] = []
    const subscription = createReleaseMetadataAggregator(mockClient)([
      '_.releases.release-1',
      '_.releases.release-2',
    ]).subscribe((value) => values.push(value))

    await new Promise((resolve) => setTimeout(resolve, 0))
    subscription.unsubscribe()

    expect(values).toEqual([
      {loading: true, data: null, error: null},
      {
        loading: false,
        error: null,
        data: {
          ms: {documentCount: 0},
          result: {
            '_.releases.release-1': {updatedAt: '2024-01-01T00:00:00Z', documentCount: 1},
            '_.releases.release-2': {updatedAt: '2024-01-02T00:00:00Z', documentCount: 2},
            'documentCount': 0,
          },
        },
      },
    ])
  })
})
