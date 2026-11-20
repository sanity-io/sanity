import {afterEach, describe, expect, test, vi} from 'vitest'

import {resolveGitHubToken} from './githubToken'

describe('resolveGitHubToken', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  test('prefers GITHUB_TOKEN', () => {
    vi.stubEnv('GITHUB_TOKEN', 'from-actions')
    vi.stubEnv('GH_TOKEN', 'from-local')
    expect(resolveGitHubToken()).toBe('from-actions')
  })

  test('falls back to GH_TOKEN', () => {
    vi.stubEnv('GITHUB_TOKEN', '')
    vi.stubEnv('GH_TOKEN', 'from-local')
    expect(resolveGitHubToken()).toBe('from-local')
  })
})
