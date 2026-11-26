import {test as baseTest, vi} from 'vitest'

import {createRequestErrorChannel} from '../../src/core/studio/requestErrors/createRequestErrorChannel'
import {registerListenerErrorHandler} from '../../src/core/util/listenerErrorHandlers'

/**
 * `test` with the registered handlers of listeners that fail irrecoverably.
 *
 * `listenerErrorHandler` registers a handler that takes over every listener that fails
 * irrecoverably, as the studio's request error channel does (it never settles), until the test
 * ends. `requestErrorChannel` registers a real request error channel instead, as the studio does,
 * for tests that check what the dialog would show (`claim$`).
 */
export const test = baseTest
  .extend('listenerErrorHandler', ({onTestFinished}) => {
    const handler = {handle: vi.fn((_err: unknown): Promise<never> => new Promise(() => {}))}
    onTestFinished(registerListenerErrorHandler(handler))
    return handler
  })
  .extend('requestErrorChannel', ({onTestFinished}) => {
    const channel = createRequestErrorChannel()
    onTestFinished(registerListenerErrorHandler(channel))
    return channel
  })

export {test as it}
