import {ClientError, createClient, type RequestHandler} from '@sanity/client'
import {filter, firstValueFrom} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createMockAuthStore} from '../../store/authStore/createMockAuthStore'
import {type AuthStore} from '../../store/authStore/types'
import {createRequestErrorChannel} from '../../studio/requestErrors/createRequestErrorChannel'
import {createStudioRequestHandler} from '../../studio/requestErrors/createStudioRequestHandler'
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

const passthrough: RequestHandler = (request, next) => next(request)

// A pre-built store: `createMockAuthStore` plus the `logout` the studio needs
// to complete a forced logout.
function createPrebuiltStore(projectId: string): AuthStore {
  return {
    ...createMockAuthStore({
      client: createClient({projectId, dataset: 'test', apiVersion: '2025-01-01', useCdn: false}),
      currentUser: null,
    }),
    logout: () => Promise.resolve(),
  }
}

describe('prepareConfig — studio request handler', () => {
  it('passes the handler to a custom client factory', () => {
    const clientFactory = vi.fn(createClient)

    prepareConfig(createWorkspace({unstable_clientFactory: clientFactory}), {
      createStudioRequestHandler: () => passthrough,
    })

    expect(clientFactory).toHaveBeenCalled()
    for (const [config] of clientFactory.mock.calls) {
      expect(config.requestHandler).toBe(passthrough)
    }
  })

  it('keeps `workspace.auth` identity stable across prepareConfig calls', () => {
    // `WorkspacesProvider` calls `prepareConfig` during render, and a single
    // (non-array) config is re-prepared every call — `AuthBoundary` keys its
    // one-shot `handleCallbackUrl()` on `activeWorkspace.auth`, so a wrapper
    // rebuilt per render would re-run the credential exchange every render
    // and never settle the callback gate.
    const workspace = createWorkspace({auth: createPrebuiltStore('abc123')})

    const first = prepareConfig(workspace, {createStudioRequestHandler: () => passthrough})
    const second = prepareConfig(workspace, {createStudioRequestHandler: () => passthrough})

    expect(second.workspaces[0]).not.toBe(first.workspaces[0])
    expect(second.workspaces[0].auth).toBe(first.workspaces[0].auth)
  })

  // End-to-end guard for the pre-built store decorator (unit-tested in
  // getAuthStore.test.ts): the session dies mid-edit and a data request on a
  // client derived from the store's client (as `source.getClient()` does)
  // answers 401 with the API's invalid-session code. With the studio handler
  // in place that request is parked and the channel raises the `unauthorized`
  // claim that drives the logout; without it the `ClientError` rejects
  // straight into the pane that made the request.
  it('routes an invalid-session 401 on a pre-built store client into a forced logout claim', async () => {
    const workspace = createWorkspace({
      // Hostname-shaped, so the channel can attribute the claim to a project.
      projectId: `abc${Math.random().toString(36).slice(2, 8)}`,
    })
    const auth = createPrebuiltStore(workspace.projectId)
    const channel = createRequestErrorChannel()

    const {workspaces} = prepareConfig(
      {...workspace, auth},
      {
        createStudioRequestHandler: (getClient) => createStudioRequestHandler({channel, getClient}),
      },
    )

    const {client} = await firstValueFrom(workspaces[0].auth.state)
    const dataClient = client.withConfig({apiVersion: '2025-02-19'})
    const url = `https://${workspace.projectId}.api.sanity.io/v2025-02-19/data/history/test/events/documents/drafts.x`
    const sessionNotFound = new ClientError({
      body: {
        error: 'Unauthorized',
        errorCode: 'SIO-401-ANF',
        message: 'Session not found',
        statusCode: 401,
      },
      headers: {'content-type': 'application/json'},
      method: 'GET',
      statusCode: 401,
      statusMessage: 'Unauthorized',
      url,
    })

    let settled = false
    void dataClient.config().requestHandler!(
      {method: 'GET', url},
      vi.fn().mockRejectedValue(sessionNotFound),
    ).finally(() => {
      settled = true
    })

    await expect(
      firstValueFrom(channel.claim$.pipe(filter((claim) => claim !== undefined))),
    ).resolves.toMatchObject({type: 'unauthorized', projectId: workspace.projectId})
    expect(settled).toBe(false)
  })
})
