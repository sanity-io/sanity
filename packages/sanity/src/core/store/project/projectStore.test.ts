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
  token?: string
}

const createMockClient = ({projectId, requestImplementation, token}: MockClientOptions) => {
  const request = vi.fn(requestImplementation)
  const client = {
    config: () => ({projectId, dataset: 'test-dataset', token}),
    withConfig: () => client,
    observable: {request},
  }

  return client as unknown as SanityClient & {observable: {request: typeof request}}
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

  it('shares one request between getProjectName and getOrganizationId', async () => {
    const project = {...createMockProjectData('org-shared'), displayName: 'Shared project'}
    const client = createMockClient({
      projectId: 'shared-request-project',
      requestImplementation: () => of(project),
    })

    const store = createProjectStore({client})

    const names: Array<string | null> = []
    const organizationIds: Array<string | null> = []
    const subscription = store.getProjectName().subscribe((value) => names.push(value))
    subscription.add(store.getOrganizationId().subscribe((value) => organizationIds.push(value)))

    await vi.advanceTimersByTimeAsync(0)
    expect(names).toEqual(['Shared project'])
    expect(organizationIds).toEqual(['org-shared'])
    expect(client.observable.request).toHaveBeenCalledTimes(1)

    let replayed: string | null | undefined
    subscription.add(store.getProjectName().subscribe((value) => (replayed = value)))
    expect(replayed).toBe('Shared project')
    expect(client.observable.request).toHaveBeenCalledTimes(1)

    subscription.unsubscribe()
  })

  it('emits null from getProjectName when the request fails', async () => {
    const client = createMockClient({
      projectId: 'failing-name-project',
      requestImplementation: () => throwError(() => new Error('persistent failure')),
    })

    const store = createProjectStore({client})

    const names: Array<string | null> = []
    const subscription = store.getProjectName().subscribe((value) => names.push(value))

    await vi.advanceTimersByTimeAsync(0)
    expect(names).toEqual([null])

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

describe('createProjectStore memoization keyed by credential', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('a new-token client re-requests instead of replaying the old token’s result', async () => {
    // Two clients, same project/dataset, different tokens — as after a re-auth.
    // The memoized org request must NOT replay the first client's observable to
    // the second; otherwise the second (new-token) store would surface the old
    // token's data and, worse, keep polling on the old token.
    const oldClient = createMockClient({
      projectId: 'p',
      token: 'token-OLD',
      requestImplementation: () => of(createMockProjectData('org-OLD')),
    })
    const newClient = createMockClient({
      projectId: 'p',
      token: 'token-NEW',
      requestImplementation: () => of(createMockProjectData('org-NEW')),
    })

    const emittedA: Array<string | null> = []
    const emittedB: Array<string | null> = []

    const storeA = createProjectStore({client: oldClient})
    const subA = storeA.getOrganizationId().subscribe((v) => emittedA.push(v))
    await vi.advanceTimersByTimeAsync(0)
    expect(emittedA).toEqual(['org-OLD'])

    const storeB = createProjectStore({client: newClient})
    const subB = storeB.getOrganizationId().subscribe((v) => emittedB.push(v))
    await vi.advanceTimersByTimeAsync(0)

    // The new-token store resolved via the new client's own request, not a
    // replay of the old one.
    expect(emittedB).toEqual(['org-NEW'])
    expect(newClient.observable.request).toHaveBeenCalledTimes(1)

    subA.unsubscribe()
    subB.unsubscribe()
  })
})
