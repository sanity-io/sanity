import {of} from 'rxjs'
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

/** Issue #12952 helpers. Minimal AuthStore-shaped object — `isAuthStore` only
 * checks for `state.subscribe`, so an rxjs Observable of an empty-auth value
 * is enough to stand in for `createAuthStore(…)` without instantiating a real
 * client. */
function makeFakeAuthStore(): WorkspaceOptions['auth'] {
  return {
    state: of({authenticated: false, currentUser: null, client: null}),
  } as unknown as WorkspaceOptions['auth']
}

/** Mirrors @sanity/cli-core's `getStudioWorkspaces`:
 * `rawWorkspaces.map((w) => ({...w, auth: {state: of(getEmptyAuth())}}))`.
 * Each `.map` iteration creates a fresh stub, so any sharing the user did
 * upstream is lost. */
function substituteCliAuth(workspaces: WorkspaceOptions[]): WorkspaceOptions[] {
  return workspaces.map((workspace) => ({
    ...workspace,
    auth: {state: of({authenticated: false, currentUser: null, client: null})},
  }))
}

describe('prepareConfig — issue #12952 (CLI auth substitution)', () => {
  // Issue #12952: when the CLI loads a multi-workspace config for
  // `sanity documents validate` (and other non-runtime commands),
  // `getStudioWorkspaces` in @sanity/cli-core replaces each workspace's `auth`
  // with a freshly-allocated `{state: of(getEmptyAuth())}` stub before
  // `prepareConfig` runs. The stub satisfies `isAuthStore` (it has
  // `state.subscribe`), so `fingerprintAuth` assigns each workspace a distinct
  // `AuthStore@<id>`, and `warnOnDivergentProjectAuth` fires regardless of how
  // the user set up auth in their original config — even when all workspaces
  // shared a single `createAuthStore` reference, which the warning message
  // itself recommends as the canonical workaround.
  //
  // These tests document the contract from the sanity-package side. They do
  // not import any CLI code; they recreate the substitution inline so the
  // regression is observable in this repo even though the fix may land in
  // @sanity/cli-core.

  let consoleWarnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
  })

  it('does not warn when workspaces share a single AuthStore reference (the canonical workaround)', () => {
    // Contract check: the warning message itself recommends "consolidate to a
    // single shared config", and the comment on `fingerprintAuth` says
    // identity-equal AuthStore references should be treated as the same auth.
    // At the prepareConfig boundary this contract holds — the bug is only
    // observable once an upstream loader clones the workspaces (see below).
    const projectId = `shared-store-${Math.random().toString(36).slice(2)}`
    const warningsBefore = getCollectedConfigWarnings().length

    const sharedStore = makeFakeAuthStore()

    prepareConfig([
      createWorkspace({name: 'a', projectId, basePath: '/a', auth: sharedStore}),
      createWorkspace({name: 'b', projectId, basePath: '/b', auth: sharedStore}),
      createWorkspace({name: 'c', projectId, basePath: '/c', auth: sharedStore}),
    ])

    const newWarnings = getCollectedConfigWarnings().slice(warningsBefore)
    const authWarning = newWarnings.find(
      (w) => w.type === 'project-auth-divergence' && w.projectId === projectId,
    )
    expect(authWarning).toBeUndefined()
  })

  // Regression for issue #12952. Fails on main. Will pass once a fix lands
  // that makes the divergence check respect what the user originally declared
  // (e.g. suppressing the warning when the CLI stub shape is detected, or
  // moving the check past the CLI's auth substitution).
  it('does not warn when the CLI substitutes auth on workspaces that originally shared a reference (#12952)', () => {
    const projectId = `issue12952-${Math.random().toString(36).slice(2)}`
    const warningsBefore = getCollectedConfigWarnings().length

    // 1. User's config: three workspaces sharing one AuthStore reference.
    const sharedStore = makeFakeAuthStore()
    const userWorkspaces: WorkspaceOptions[] = [
      createWorkspace({name: 'a', projectId, basePath: '/a', auth: sharedStore}),
      createWorkspace({name: 'b', projectId, basePath: '/b', auth: sharedStore}),
      createWorkspace({name: 'c', projectId, basePath: '/c', auth: sharedStore}),
    ]

    // 2. CLI substitution runs upstream, replacing each `auth` with a fresh
    //    stub. The user no longer has a way to express "share auth".
    const cliWorkspaces = substituteCliAuth(userWorkspaces)

    // 3. prepareConfig should still NOT fire the warning: the user did the
    //    right thing, the divergence is entirely an artifact of the CLI's
    //    substitution.
    prepareConfig(cliWorkspaces)

    const newWarnings = getCollectedConfigWarnings().slice(warningsBefore)
    const authWarning = newWarnings.find(
      (w) => w.type === 'project-auth-divergence' && w.projectId === projectId,
    )
    expect(authWarning).toBeUndefined()
  })
})

describe('prepareConfig — workspace hidden property', () => {
  it('preserves a boolean `hidden` value on the workspace summary', () => {
    const {workspaces} = prepareConfig([
      createWorkspace({name: 'visible', basePath: '/visible', hidden: false}),
      createWorkspace({name: 'hidden-bool', basePath: '/hidden-bool', hidden: true}),
    ])

    expect(workspaces.find((w) => w.name === 'visible')?.hidden).toBe(false)
    expect(workspaces.find((w) => w.name === 'hidden-bool')?.hidden).toBe(true)
  })

  it('preserves a function-based `hidden` callback on the workspace summary', () => {
    const hidden = vi.fn(() => true)

    const {workspaces} = prepareConfig([
      createWorkspace({name: 'callback', basePath: '/callback', hidden}),
    ])

    expect(workspaces.find((w) => w.name === 'callback')?.hidden).toBe(hidden)
  })
})
