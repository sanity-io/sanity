import {test as baseTest, vi} from 'vitest'

import {createRequestErrorChannel} from '../../src/core/studio/requestErrors/createRequestErrorChannel'
import {registerListenerErrorHandler} from '../../src/core/util/listenerErrorHandlers'

let projectCounter = 0

/**
 * `test` with a `projectId` that no other test uses.
 *
 * The listeners of a project share their outages through a registry that lives as long as the test
 * file (`listenerOutagesForProject`), and so does the error handler registered for the project
 * (`registerListenerErrorHandler`). A test that leaves a listener of its project down would make
 * the listeners of every later test of that project start an outage as soon as they connect. A
 * client configured with this `projectId` gets a registry of its own instead.
 *
 * `listenerErrorHandler` registers a handler for the test's project that takes over every listener
 * that fails for good, as the studio's request error channel does (it never settles), until the
 * test ends. `requestErrorChannel` registers a real request error channel instead, as the studio
 * does, for tests that check what the dialog would show (`claim$`). Use one or the other.
 */
export const test = baseTest
  .extend('projectId', () => `test-project-${(projectCounter += 1)}`)
  .extend('listenerErrorHandler', ({projectId}, {onCleanup}) => {
    const handler = {handle: vi.fn((_err: unknown): Promise<never> => new Promise(() => {}))}
    onCleanup(registerListenerErrorHandler(projectId, handler))
    return handler
  })
  .extend('requestErrorChannel', ({projectId}, {onCleanup}) => {
    const channel = createRequestErrorChannel()
    onCleanup(registerListenerErrorHandler(projectId, channel))
    return channel
  })

export {test as it}
