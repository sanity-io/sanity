import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {getCollectedConfigWarnings} from '../configWarnings'
import {prepareConfig} from '../prepareConfig'
import {type WorkspaceOptions} from '../types'

// Minimum viable workspace for prepareConfig — avoids pulling in real
// schema/client resolution. projectId is randomized per test so the
// module-level warning dedupe doesn't bleed across cases.
function createWorkspace(overrides: Partial<WorkspaceOptions>): WorkspaceOptions {
  return {
    name: 'test',
    basePath: '/',
    projectId: `test-${Math.random().toString(36).slice(2)}`,
    dataset: 'test',
    ...overrides,
  }
}

describe('prepareConfig — divergent auth warning', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
  })

  it('warns when two workspaces for the same project declare different auth configs', () => {
    const projectId = `divergent-${Math.random().toString(36).slice(2)}`
    const warningsBefore = getCollectedConfigWarnings().length

    prepareConfig([
      createWorkspace({
        name: 'cookie-workspace',
        projectId,
        basePath: '/cookie',
        auth: {loginMethod: 'cookie'},
      }),
      createWorkspace({
        name: 'token-workspace',
        projectId,
        basePath: '/token',
        auth: {loginMethod: 'token'},
      }),
    ])

    const newWarnings = getCollectedConfigWarnings().slice(warningsBefore)
    const authWarning = newWarnings.find(
      (w) => w.type === 'project-auth-divergence' && w.projectId === projectId,
    )
    expect(authWarning).toBeDefined()
    expect(authWarning?.groups).toEqual(
      expect.arrayContaining([['cookie-workspace'], ['token-workspace']]),
    )
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining(`Workspaces for project "${projectId}" declare different`),
    )
  })

  it('does not warn when two workspaces for the same project declare identical auth configs', () => {
    const projectId = `identical-${Math.random().toString(36).slice(2)}`
    const warningsBefore = getCollectedConfigWarnings().length

    prepareConfig([
      createWorkspace({
        name: 'w1',
        projectId,
        basePath: '/w1',
        auth: {loginMethod: 'cookie'},
      }),
      createWorkspace({
        name: 'w2',
        projectId,
        basePath: '/w2',
        auth: {loginMethod: 'cookie'},
      }),
    ])

    const newWarnings = getCollectedConfigWarnings().slice(warningsBefore)
    const authWarning = newWarnings.find(
      (w) => w.type === 'project-auth-divergence' && w.projectId === projectId,
    )
    expect(authWarning).toBeUndefined()
    expect(consoleWarnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining(`Workspaces for project "${projectId}" declare different`),
    )
  })

  it('does not warn when workspaces for different projects each have their own auth config', () => {
    const projectA = `projA-${Math.random().toString(36).slice(2)}`
    const projectB = `projB-${Math.random().toString(36).slice(2)}`
    const warningsBefore = getCollectedConfigWarnings().length

    prepareConfig([
      createWorkspace({
        name: 'a',
        projectId: projectA,
        basePath: '/a',
        auth: {loginMethod: 'cookie'},
      }),
      createWorkspace({
        name: 'b',
        projectId: projectB,
        basePath: '/b',
        auth: {loginMethod: 'token'},
      }),
    ])

    const newWarnings = getCollectedConfigWarnings().slice(warningsBefore)
    const authWarning = newWarnings.find(
      (w) =>
        w.type === 'project-auth-divergence' &&
        (w.projectId === projectA || w.projectId === projectB),
    )
    expect(authWarning).toBeUndefined()
  })

  it('does not warn when only one workspace is configured for a project', () => {
    const projectId = `single-${Math.random().toString(36).slice(2)}`
    const warningsBefore = getCollectedConfigWarnings().length

    prepareConfig([
      createWorkspace({
        name: 'solo',
        projectId,
        basePath: '/',
        auth: {loginMethod: 'cookie'},
      }),
    ])

    const newWarnings = getCollectedConfigWarnings().slice(warningsBefore)
    const authWarning = newWarnings.find(
      (w) => w.type === 'project-auth-divergence' && w.projectId === projectId,
    )
    expect(authWarning).toBeUndefined()
  })

  it('does not warn when two workspaces declare the same auth config with different property order', () => {
    // AuthConfig is fingerprinted via a canonical (key-sorted) hash so that
    // `{loginMethod: 'cookie', mode: 'replace'}` and
    // `{mode: 'replace', loginMethod: 'cookie'}` compare equal — property
    // declaration order and autoformatter reordering must not produce false
    // positives.
    const projectId = `order-${Math.random().toString(36).slice(2)}`
    const warningsBefore = getCollectedConfigWarnings().length

    prepareConfig([
      createWorkspace({
        name: 'w1',
        projectId,
        basePath: '/w1',
        auth: {loginMethod: 'cookie', mode: 'replace', redirectOnSingle: true},
      }),
      createWorkspace({
        name: 'w2',
        projectId,
        basePath: '/w2',
        auth: {redirectOnSingle: true, mode: 'replace', loginMethod: 'cookie'},
      }),
    ])

    const newWarnings = getCollectedConfigWarnings().slice(warningsBefore)
    const authWarning = newWarnings.find(
      (w) => w.type === 'project-auth-divergence' && w.projectId === projectId,
    )
    expect(authWarning).toBeUndefined()
  })
})
