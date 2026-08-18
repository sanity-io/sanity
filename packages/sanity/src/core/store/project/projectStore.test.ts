import {type SanityClient} from '@sanity/client'
import {defer, of, throwError} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createProjectStore} from './projectStore'
import {type ProjectData} from './types'

const REFETCH_INTERVAL = 5 * 60 * 1000

const createMockProjectData = (organizationId: string): ProjectData =>
  ({
    id: 'test-project',
    organizationId,
    organization: {id: organizationId, name: `org-${organizationId}`},
  }) as unknown as ProjectData

interface MockClientOptions {
  projectId: string
  requestImplementation: () => ReturnType<SanityClient['observable']['request']>
}

const createMockClient = ({projectId, requestImplementation}: MockClientOptions) => {
  const client = {
    config: () => ({projectId, dataset: 'test-dataset'}),
    withConfig: () => client,
    observable: {
      request: vi.fn(requestImplementation),
    },
  }

  return client as unknown as SanityClient
}

describe('createProjectStore getOrganizationId', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('retains the last known organization id when a refetch fails transiently', async () => {
    let callCount = 0

    // Each unique projectId gets its own memoized stream, so transient state
    // does not leak between tests.
    const client = createMockClient({
      projectId: 'transient-failure-project',
      requestImplementation: () =>
        defer(() => {
          callCount += 1
          // First fetch succeeds, the refetch fails, the next refetch succeeds.
          if (callCount === 2) {
            return throwError(() => new Error('transient network failure'))
          }
          return of(createMockProjectData(callCount === 1 ? 'org-a' : 'org-b'))
        }),
    })

    const store = createProjectStore({client})

    const emitted: Array<string | null> = []
    const subscription = store.getOrganizationId().subscribe((value) => emitted.push(value))

    // First successful fetch.
    await vi.advanceTimersByTimeAsync(0)
    expect(emitted.at(-1)).toBe('org-a')

    // Refetch fails: the stream must retain the previously-good org id rather
    // than clobbering it with null.
    await vi.advanceTimersByTimeAsync(REFETCH_INTERVAL)
    expect(emitted).not.toContain(null)
    expect(emitted.at(-1)).toBe('org-a')

    // Next refetch succeeds with a new value.
    await vi.advanceTimersByTimeAsync(REFETCH_INTERVAL)
    expect(emitted.at(-1)).toBe('org-b')

    subscription.unsubscribe()
  })

  it('emits null only when no organization id has ever been resolved', async () => {
    const client = createMockClient({
      projectId: 'always-failing-project',
      requestImplementation: () => throwError(() => new Error('persistent failure')),
    })

    const store = createProjectStore({client})

    const emitted: Array<string | null> = []
    const subscription = store.getOrganizationId().subscribe((value) => emitted.push(value))

    await vi.advanceTimersByTimeAsync(0)
    expect(emitted).toEqual([null])

    subscription.unsubscribe()
  })
})
