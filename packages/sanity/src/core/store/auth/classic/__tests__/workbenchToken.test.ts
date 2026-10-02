import {BehaviorSubject, firstValueFrom, toArray} from 'rxjs'
import {afterEach, describe, expect, it, vi} from 'vitest'

const connectMessageBus = vi.hoisted(() => vi.fn())
vi.mock('@sanity/sdk/dashboard', () => ({connectMessageBus}))

function fakeBus(token$: BehaviorSubject<string | null>) {
  return {
    subscribe: vi.fn(() => token$),
    emit: vi.fn(() => Promise.resolve('token')),
  }
}

// The module keeps one connection for its lifetime, so each test gets a fresh copy.
async function load() {
  vi.resetModules()
  return import('../workbenchToken')
}

describe('workbenchToken', () => {
  afterEach(() => {
    connectMessageBus.mockReset()
  })

  it('is undefined and a no-op outside the workbench', async () => {
    connectMessageBus.mockReturnValue(undefined)
    const {observeWorkbenchToken, refreshWorkbenchToken} = await load()

    expect(observeWorkbenchToken()).toBeUndefined()
    expect(() => refreshWorkbenchToken()).not.toThrow()
  })

  it('emits the `auth.token` state as it changes', async () => {
    const token$ = new BehaviorSubject<string | null>('first')
    const bus = fakeBus(token$)
    connectMessageBus.mockReturnValue(bus)
    const {observeWorkbenchToken} = await load()

    const tokens = firstValueFrom(observeWorkbenchToken()!.pipe(toArray()))
    expect(bus.subscribe).toHaveBeenCalledWith('auth.token')
    token$.next(null)
    token$.next('second')
    token$.complete()

    expect(await tokens).toEqual(['first', null, 'second'])
  })

  it('shares one connection between observing and refreshing', async () => {
    const bus = fakeBus(new BehaviorSubject<string | null>('token'))
    connectMessageBus.mockReturnValue(bus)
    const {observeWorkbenchToken, refreshWorkbenchToken} = await load()

    observeWorkbenchToken()
    observeWorkbenchToken()
    refreshWorkbenchToken()

    expect(bus.emit).toHaveBeenCalledWith('auth.token.refresh')
    expect(connectMessageBus).toHaveBeenCalledTimes(1)
  })

  it('drops a failed refresh request', async () => {
    const bus = fakeBus(new BehaviorSubject<string | null>('token'))
    bus.emit.mockReturnValue(Promise.reject(new Error('NO_RESPONDER')))
    connectMessageBus.mockReturnValue(bus)
    const {refreshWorkbenchToken} = await load()

    refreshWorkbenchToken()
    // Flush the rejection; an unhandled one would fail the run.
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(bus.emit).toHaveBeenCalled()
  })
})
