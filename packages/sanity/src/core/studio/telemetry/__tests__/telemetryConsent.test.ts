import {type SanityClient} from '@sanity/client'
import {firstValueFrom, of} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

describe('getTelemetryConsent$', () => {
  function createMockClient(projectId: string, status = 'granted') {
    return {
      config: () => ({projectId}),
      observable: {
        request: vi.fn().mockReturnValue(of({status})),
      },
    } as unknown as SanityClient
  }

  let getTelemetryConsent$: typeof import('../telemetryConsent').getTelemetryConsent$

  beforeEach(async () => {
    vi.resetModules()
    const mod = await import('../telemetryConsent')
    getTelemetryConsent$ = mod.getTelemetryConsent$
  })

  it('returns "granted" when the API responds with granted', async () => {
    const client = createMockClient('project-a', 'granted')
    const result = await firstValueFrom(getTelemetryConsent$(client))
    expect(result).toBe('granted')
  })

  it('returns "denied" when the API responds with anything other than granted', async () => {
    const client = createMockClient('project-a', 'denied')
    const result = await firstValueFrom(getTelemetryConsent$(client))
    expect(result).toBe('denied')
  })

  it('caches the observable for the same project ID', () => {
    const client = createMockClient('project-a')
    const obs1 = getTelemetryConsent$(client)
    const obs2 = getTelemetryConsent$(client)

    expect(obs1).toBe(obs2)
    expect(client.observable.request).toHaveBeenCalledTimes(1)
  })

  it('creates separate observables for different project IDs', async () => {
    const clientA = createMockClient('project-a', 'granted')
    const clientB = createMockClient('project-b', 'denied')

    const obsA = getTelemetryConsent$(clientA)
    const obsB = getTelemetryConsent$(clientB)

    expect(obsA).not.toBe(obsB)
    expect(clientA.observable.request).toHaveBeenCalledTimes(1)
    expect(clientB.observable.request).toHaveBeenCalledTimes(1)

    const resultA = await firstValueFrom(obsA)
    const resultB = await firstValueFrom(obsB)
    expect(resultA).toBe('granted')
    expect(resultB).toBe('denied')
  })

  it('reuses the cached observable when a different client has the same project ID', () => {
    const client1 = createMockClient('project-a')
    const client2 = createMockClient('project-a')

    const obs1 = getTelemetryConsent$(client1)
    const obs2 = getTelemetryConsent$(client2)

    expect(obs1).toBe(obs2)
    expect(client1.observable.request).toHaveBeenCalledTimes(1)
    expect(client2.observable.request).not.toHaveBeenCalled()
  })

  it('uses "__default" key when projectId is undefined', () => {
    const client = {
      config: () => ({projectId: undefined}),
      observable: {
        request: vi.fn().mockReturnValue(of({status: 'granted'})),
      },
    } as unknown as SanityClient

    const obs1 = getTelemetryConsent$(client)
    const obs2 = getTelemetryConsent$(client)

    expect(obs1).toBe(obs2)
    expect(client.observable.request).toHaveBeenCalledTimes(1)
  })
})
