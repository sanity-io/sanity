import {beforeAll, describe, expect, it, vi} from 'vitest'

import {getTaskURL} from './TasksNotificationTarget'

describe('getTaskURL', () => {
  beforeAll(() => {
    // Mock window.location
    vi.stubGlobal('location', {origin: 'http://test-studio.com'})
  })

  it('constructs correct URL without basePath', () => {
    const url = getTaskURL('task-id-123', undefined, 'structure')
    expect(url).toBe(
      'http://test-studio.com/structure/?sidebar=tasks&selectedTask=task-id-123&viewMode=edit',
    )
  })

  it('constructs correct URL with basePath', () => {
    const url = getTaskURL('task-id-123', '/basepath', 'structure')
    expect(url).toBe(
      'http://test-studio.com/basepath/structure/?sidebar=tasks&selectedTask=task-id-123&viewMode=edit',
    )
  })

  it('constructs correct URL with basePath with more than one path', () => {
    const url = getTaskURL('task-id-123', '/basepath/subpath', 'structure')
    expect(url).toBe(
      'http://test-studio.com/basepath/subpath/structure/?sidebar=tasks&selectedTask=task-id-123&viewMode=edit',
    )
  })

  it('handles missing toolName', () => {
    const url = getTaskURL('task-id-123', '/basepath')
    expect(url).toBe(
      'http://test-studio.com/basepath/?sidebar=tasks&selectedTask=task-id-123&viewMode=edit',
    )
  })

  it('constructs correct URL with all parameters', () => {
    const url = getTaskURL('task-id-456', '/anotherpath', 'structure')
    expect(url).toBe(
      'http://test-studio.com/anotherpath/structure/?sidebar=tasks&selectedTask=task-id-456&viewMode=edit',
    )
  })
})
