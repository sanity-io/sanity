import {createClient} from '@sanity/client'
import {firstValueFrom} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import type * as SchemaModule from '../../schema'
import {createSchema} from '../../schema'
import {createMockAuthStore} from '../../store'
import {getCollectedConfigWarnings} from '../configWarnings'
import {prepareConfig} from '../prepareConfig'
import {SchemaError} from '../SchemaError'
import {type WorkspaceOptions} from '../types'

// Wrap createSchema in a spy so ordering tests can assert call timing.
// Using importActual on the small internal schema module (not the full 'sanity'
// package) is safe and avoids the timeout risk documented in MEMORY.md.
vi.mock('../../schema', async () => {
  const actual = await vi.importActual<typeof SchemaModule>('../../schema')
  return {
    ...actual,
    createSchema: vi.fn(actual.createSchema),
  }
})

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
    // `{loginMethod: 'cookie', redirectOnSingle: true}` and
    // `{redirectOnSingle: true, loginMethod: 'cookie'}` compare equal —
    // property declaration order and autoformatter reordering must not
    // produce false positives.
    const projectId = `order-${Math.random().toString(36).slice(2)}`
    const warningsBefore = getCollectedConfigWarnings().length

    prepareConfig([
      createWorkspace({
        name: 'w1',
        projectId,
        basePath: '/w1',
        auth: {loginMethod: 'cookie', redirectOnSingle: true},
      }),
      createWorkspace({
        name: 'w2',
        projectId,
        basePath: '/w2',
        auth: {redirectOnSingle: true, loginMethod: 'cookie'},
      }),
    ])

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

// Build a minimal Sanity client that satisfies resolveSource without making
// real network requests.
function createTestClient(projectId: string) {
  return createClient({
    projectId,
    dataset: 'test',
    apiVersion: '2021-06-07',
    useCdn: false,
  })
}

describe('prepareConfig — deferred schema compilation', () => {
  const createSchemaSpy = vi.mocked(createSchema)

  beforeEach(() => {
    createSchemaSpy.mockClear()
  })

  describe('(a) ordering: createSchema not called until source$ is subscribed', () => {
    it('does not call createSchema during prepareConfig; calls it exactly once on first subscription', async () => {
      const projectId = `ordering-${Math.random().toString(36).slice(2)}`
      const client = createTestClient(projectId)
      const authStore = createMockAuthStore({client, currentUser: null})

      const {workspaces} = prepareConfig([
        createWorkspace({name: 'default', projectId, auth: authStore}),
      ])

      // Schema compile must NOT have run yet — prepareConfig is pre-auth.
      expect(createSchemaSpy).not.toHaveBeenCalled()

      const sourceObservable = workspaces[0].__internal.sources[0].source

      // First subscription triggers auth.state emission -> getSchema() -> createSchema.
      await firstValueFrom(sourceObservable)

      expect(createSchemaSpy).toHaveBeenCalledTimes(1)

      // Second subscription reuses the memoized schema; createSchema stays at 1.
      await firstValueFrom(sourceObservable)

      expect(createSchemaSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('(b) deferred schema error: SchemaError surfaces on source$ instead of synchronously', () => {
    it('does not throw from prepareConfig when schema types are invalid; source$ errors with SchemaError', async () => {
      const projectId = `schema-err-${Math.random().toString(36).slice(2)}`
      const client = createTestClient(projectId)
      const authStore = createMockAuthStore({client, currentUser: null})

      // A type definition whose name collides with a built-in type triggers a
      // schema validation error (severity: 'error') in @sanity/schema.
      const invalidSchemaTypes = [{name: 'object', type: 'object', fields: []}]

      // prepareConfig must NOT throw synchronously even with an invalid schema.
      const {workspaces} = prepareConfig([
        createWorkspace({
          name: 'default',
          projectId,
          auth: authStore,
          schema: {types: invalidSchemaTypes},
        }),
      ])

      const sourceObservable = workspaces[0].__internal.sources[0].source

      // Subscribing triggers the deferred compile; the SchemaError must surface.
      let caughtError: unknown
      await firstValueFrom(sourceObservable).catch((err) => {
        caughtError = err
      })

      expect(caughtError).toBeInstanceOf(SchemaError)
    })
  })

  describe('(c) end-to-end: valid workspace resolves Source with expected deferred schema', () => {
    it('source$ emits a resolved Source whose schema contains the configured document types', async () => {
      const projectId = `e2e-${Math.random().toString(36).slice(2)}`
      const client = createTestClient(projectId)
      const authStore = createMockAuthStore({client, currentUser: null})

      const {workspaces} = prepareConfig([
        createWorkspace({
          name: 'default',
          projectId,
          auth: authStore,
          schema: {
            types: [{name: 'article', type: 'document', fields: [{name: 'title', type: 'string'}]}],
          },
        }),
      ])

      const resolvedSource = await firstValueFrom(workspaces[0].__internal.sources[0].source)

      expect(resolvedSource.schema).toBeDefined()
      expect(resolvedSource.schema.getTypeNames()).toContain('article')
    })
  })
})
