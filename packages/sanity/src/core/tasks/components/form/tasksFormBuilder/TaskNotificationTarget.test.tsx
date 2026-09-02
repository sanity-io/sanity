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

  it('builds on an explicit origin instead of window.location.origin', () => {
    const url = getTaskURL(
      'task-id-123',
      '/basepath',
      'structure',
      'https://www.sanity.io/@org/studio/app-id/default',
    )
    expect(url).toBe(
      'https://www.sanity.io/@org/studio/app-id/default/basepath/structure/?sidebar=tasks&selectedTask=task-id-123&viewMode=edit',
    )
  })

  it('omits the basePath when the dashboard URL already identifies the workspace', () => {
    // Regression test for SAPP-3134. In the dashboard the workspace is addressed by the
    // dashboard path, so the caller passes no basePath — repeating it yields a path the
    // dashboard cannot resolve, dropping the user on Structure instead of the task.
    const url = getTaskURL(
      'task-id-123',
      undefined,
      'structure',
      'https://www.sanity.io/@org/studio/app-id/default',
    )
    expect(url).toBe(
      'https://www.sanity.io/@org/studio/app-id/default/structure/?sidebar=tasks&selectedTask=task-id-123&viewMode=edit',
    )
  })
})
