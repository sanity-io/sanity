import {describe, expect, it} from 'vitest'

import {
  listenerErrorHandlerForProject,
  registerListenerErrorHandler,
} from '../listenerErrorHandlers'

let projectCounter = 0
const uniqueProject = () => `registry-project-${(projectCounter += 1)}`

const handler = () => ({handle: (): Promise<never> => new Promise(() => {})})

describe('registerListenerErrorHandler', () => {
  it('registers a handler for its project until it is removed', () => {
    const projectId = uniqueProject()
    const registered = handler()
    const unregister = registerListenerErrorHandler(projectId, registered)

    expect(listenerErrorHandlerForProject(projectId)).toBe(registered)
    expect(listenerErrorHandlerForProject(uniqueProject())).toBeUndefined()

    unregister()
    expect(listenerErrorHandlerForProject(projectId)).toBeUndefined()
  })

  it('lets the latest handler win, and hands the project back when it is removed', () => {
    const projectId = uniqueProject()
    const first = handler()
    const second = handler()
    const unregisterFirst = registerListenerErrorHandler(projectId, first)
    const unregisterSecond = registerListenerErrorHandler(projectId, second)
    expect(listenerErrorHandlerForProject(projectId)).toBe(second)

    unregisterSecond()
    expect(listenerErrorHandlerForProject(projectId)).toBe(first)
    unregisterFirst()
    expect(listenerErrorHandlerForProject(projectId)).toBeUndefined()
  })

  it('removes only its own registration', () => {
    const projectId = uniqueProject()
    const first = handler()
    const second = handler()
    const unregisterFirst = registerListenerErrorHandler(projectId, first)
    registerListenerErrorHandler(projectId, second)

    unregisterFirst()
    expect(listenerErrorHandlerForProject(projectId)).toBe(second)
  })
})
