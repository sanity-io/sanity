import {test as baseTest} from 'vitest'

let projectCounter = 0

/**
 * `test` with a `projectId` that no other test uses.
 *
 * The listeners of a project share their outages through a registry that lives as long as the test
 * file (`listenerOutagesForProject`). A test that leaves a listener of its project down would make
 * the listeners of every later test of that project start an outage as soon as they connect. A
 * client configured with this `projectId` gets an outage registry of its own instead.
 */
export const test = baseTest.extend('projectId', () => `test-project-${(projectCounter += 1)}`)

export {test as it}
