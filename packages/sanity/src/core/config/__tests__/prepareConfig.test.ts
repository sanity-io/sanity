import {createClient, type RequestHandler} from '@sanity/client'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {getCollectedConfigWarnings} from '../configWarnings'
import {prepareConfig} from '../prepareConfig'
import {SchemaError} from '../SchemaError'
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

describe('prepareConfig — studio request handler', () => {
  it('passes the handler to a custom client factory', () => {
    const requestHandler: RequestHandler = (request, next) => next(request)
    const clientFactory = vi.fn(createClient)

    prepareConfig(createWorkspace({unstable_clientFactory: clientFactory}), {
      createStudioRequestHandler: () => requestHandler,
    })

    expect(clientFactory).toHaveBeenCalled()
    for (const [config] of clientFactory.mock.calls) {
      expect(config.requestHandler).toBe(requestHandler)
    }
  })
})

describe('prepareConfig — schema error context', () => {
  // Mirrors the reported failure: a field pointing at a type that only exists
  // in a sibling workspace, which crashes the studio at runtime.
  const brokenSchemaTypes = [
    {
      type: 'document',
      name: 'mediaGalleryItem',
      fields: [{name: 'article', type: 'reference', to: [{type: 'article'}]}],
    },
  ]

  function captureSchemaError(workspaces: WorkspaceOptions[]): SchemaError {
    try {
      prepareConfig(workspaces)
    } catch (err) {
      expect(err).toBeInstanceOf(SchemaError)
      return err as SchemaError
    }
    throw new Error('expected prepareConfig to throw a SchemaError')
  }

  it('names the workspace, project and dataset that failed to compile', () => {
    const error = captureSchemaError([
      createWorkspace({
        name: 'healthy',
        basePath: '/healthy',
        schema: {types: []},
      }),
      createWorkspace({
        name: 'broken',
        basePath: '/broken',
        projectId: 'riot',
        dataset: 'live',
        schema: {types: brokenSchemaTypes},
      }),
    ])

    expect(error.context).toEqual({
      workspaceName: 'broken',
      sourceName: undefined,
      projectId: 'riot',
      dataset: 'live',
    })
  })

  it('distinguishes a nested source from its workspace', () => {
    const error = captureSchemaError([
      createWorkspace({
        name: 'broken',
        basePath: '/broken',
        projectId: 'riot',
        dataset: 'live',
        unstable_sources: [
          {
            name: 'secondary',
            projectId: 'riot',
            dataset: 'archive',
            schema: {types: brokenSchemaTypes},
          },
        ],
      }),
    ])

    expect(error.context).toEqual({
      workspaceName: 'broken',
      sourceName: 'secondary',
      projectId: 'riot',
      dataset: 'archive',
    })
  })

  it('falls back to "default" for an unnamed workspace', () => {
    const error = captureSchemaError([
      {
        basePath: '/',
        projectId: 'riot',
        dataset: 'live',
        schema: {types: brokenSchemaTypes},
      } as WorkspaceOptions,
    ])

    expect(error.context).toEqual({
      workspaceName: 'default',
      sourceName: undefined,
      projectId: 'riot',
      dataset: 'live',
    })
  })
})
