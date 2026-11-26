import {describe, expect, it, onTestFinished, vi} from 'vitest'

import {
  type ListenerErrorHandler,
  registeredListenerErrorHandler,
  registerListenerErrorHandler,
} from '../listenerErrorHandlers'

// Takes the error over, as the studio's request error channel does when it shows its dialog.
const claimingHandler = () => ({
  handle: vi.fn((_err: unknown): Promise<never> => new Promise(() => {})),
})

// Passes the error on, as the studio's request error channel does for an error it does not claim.
const rejectingHandler = () => ({
  handle: vi.fn(async (err: unknown): Promise<never> => {
    throw err
  }),
})

function register(handler: ListenerErrorHandler) {
  const unregister = registerListenerErrorHandler(handler)
  onTestFinished(unregister)
  return unregister
}

/** The error the promise rejects with, or `'pending'`. Every handler here settles on a microtask, or never. */
function settled(promise: Promise<never>): Promise<unknown> {
  return Promise.race([
    promise.catch((err: unknown) => err),
    new Promise((resolve) => setTimeout(() => resolve('pending'), 0)),
  ])
}

describe('registerListenerErrorHandler', () => {
  it('registers a handler until it is removed', () => {
    expect(registeredListenerErrorHandler()).toBeUndefined()

    const unregister = register(claimingHandler())
    expect(registeredListenerErrorHandler()).toBeDefined()

    unregister()
    expect(registeredListenerErrorHandler()).toBeUndefined()
  })

  it('hands the error to every registered handler', () => {
    const first = claimingHandler()
    const second = claimingHandler()
    register(first)
    register(second)
    const error = new Error('Denied')

    void registeredListenerErrorHandler()?.handle(error)

    expect(first.handle).toHaveBeenCalledWith(error)
    expect(second.handle).toHaveBeenCalledWith(error)
  })

  it('removes only its own registration', () => {
    const first = claimingHandler()
    const second = claimingHandler()
    const unregisterFirst = register(first)
    register(second)

    unregisterFirst()
    void registeredListenerErrorHandler()?.handle(new Error('Denied'))

    expect(first.handle).not.toHaveBeenCalled()
    expect(second.handle).toHaveBeenCalled()
  })

  it('stays pending while any handler takes the error over', async () => {
    register(rejectingHandler())
    register(claimingHandler())

    const handled = registeredListenerErrorHandler()!.handle(new Error('Denied'))

    expect(await settled(handled)).toBe('pending')
  })

  it('rejects with the error once every handler has rejected', async () => {
    register(rejectingHandler())
    register(rejectingHandler())
    const error = new Error('Denied')

    const handled = registeredListenerErrorHandler()!.handle(error)

    expect(await settled(handled)).toBe(error)
  })

  it('leaves out a handler registered after the listener failed', () => {
    register(claimingHandler())
    const handler = registeredListenerErrorHandler()!
    const late = claimingHandler()
    register(late)

    void handler.handle(new Error('Denied'))

    expect(late.handle).not.toHaveBeenCalled()
  })
})
