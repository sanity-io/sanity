import {ClientError, createClient, type RequestHandler, type SanityClient} from '@sanity/client'
import {filter, firstValueFrom, of} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

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

function createFakeAuthStore(client: SanityClient, extra: Partial<AuthStore> = {}): AuthStore {
  return {
    state: of({client, authenticated: true, currentUser: null}),
    logout: () => Promise.resolve(),
    ...extra,
  }
}

function createBareClient(projectId: string) {
  return createClient({projectId, dataset: 'test', apiVersion: '2025-01-01', useCdn: false})
}

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

  // A pre-built `AuthStore` (the pre-v3.15 `auth: createAuthStore({...})`
  // recipe, still in use by SSO deploys) builds its clients before
  // `prepareConfig` runs, so the handler cannot be injected through the
  // client factory the way it is for a plain `AuthConfig`. Without it, an
  // invalid-session 401 on a data request is never claimed: nothing forces a
  // logout, and the error surfaces in whichever pane made the request.
  describe('with a pre-built auth store', () => {
    it('attaches the studio request handler to the clients the store emits', async () => {
      const seen: string[] = []
      const requestHandler: RequestHandler = (request, next) => {
        seen.push(request.url)
        return next(request)
      }
      const workspace = createWorkspace({})
      const auth = createFakeAuthStore(createBareClient(workspace.projectId))

      const {workspaces} = prepareConfig(
        {...workspace, auth},
        {createStudioRequestHandler: () => requestHandler},
      )

      const {client} = await firstValueFrom(workspaces[0].auth.state)
      expect(client.config().requestHandler).toBeDefined()

      const httpRequest = vi.fn().mockResolvedValue({})
      await client.config().requestHandler!({url: 'https://example.test/x'}, httpRequest)
      expect(seen).toEqual(['https://example.test/x'])
      expect(httpRequest).toHaveBeenCalledOnce()
    })

    it('runs the studio handler around a request handler the store already configured', async () => {
      const order: string[] = []
      const storeHandler: RequestHandler = async (request, next) => {
        order.push('store:before')
        const result = await next(request)
        order.push('store:after')
        return result
      }
      const studioHandler: RequestHandler = async (request, next) => {
        order.push('studio:before')
        const result = await next(request)
        order.push('studio:after')
        return result
      }
      const workspace = createWorkspace({})
      const auth = createFakeAuthStore(
        createBareClient(workspace.projectId).withConfig({requestHandler: storeHandler}),
      )

      const {workspaces} = prepareConfig(
        {...workspace, auth},
        {createStudioRequestHandler: () => studioHandler},
      )

      const {client} = await firstValueFrom(workspaces[0].auth.state)
      await client.config().requestHandler!({url: 'https://example.test/x'}, () =>
        Promise.resolve({}),
      )
      expect(order).toEqual(['studio:before', 'store:before', 'store:after', 'studio:after'])
    })

    it('leaves the emitted client alone when the store cannot complete a forced logout', async () => {
      // The studio's response to a claimed invalid-session 401 is to park the
      // request and log the user out. A store without `logout` would just
      // leave the request pending, so its clients keep surfacing the error.
      const workspace = createWorkspace({})
      const auth = createFakeAuthStore(createBareClient(workspace.projectId), {logout: undefined})

      const {workspaces} = prepareConfig(
        {...workspace, auth},
        {createStudioRequestHandler: () => (request, next) => next(request)},
      )

      const {client} = await firstValueFrom(workspaces[0].auth.state)
      expect(client.config().requestHandler).toBeUndefined()
    })

    it('passes the store through untouched when no studio handler is configured', () => {
      const workspace = createWorkspace({})
      const auth = createFakeAuthStore(createBareClient(workspace.projectId))

      const {workspaces} = prepareConfig({...workspace, auth})

      expect(workspaces[0].auth).toBe(auth)
    })

    it('emits one wrapped client per upstream client, shared by every subscriber', async () => {
      const workspace = createWorkspace({})
      const auth = createFakeAuthStore(createBareClient(workspace.projectId))

      const {workspaces} = prepareConfig(
        {...workspace, auth},
        {createStudioRequestHandler: () => (request, next) => next(request)},
      )

      const first = await firstValueFrom(workspaces[0].auth.state)
      const second = await firstValueFrom(workspaces[0].auth.state)
      expect(second.client).toBe(first.client)
    })

    it('resolves workspaces that share a pre-built store to the same wrapped store', () => {
      const projectId = `shared-${Math.random().toString(36).slice(2)}`
      const auth = createFakeAuthStore(createBareClient(projectId))
      const passthrough: RequestHandler = (request, next) => next(request)

      const {workspaces} = prepareConfig(
        [
          createWorkspace({name: 'a', basePath: '/a', projectId, auth}),
          createWorkspace({name: 'b', basePath: '/b', projectId, auth}),
        ],
        {createStudioRequestHandler: () => passthrough},
      )

      expect(workspaces[0].auth).not.toBe(auth)
      expect(workspaces[1].auth).toBe(workspaces[0].auth)
    })

    it('routes an invalid-session 401 on a source client into a forced logout claim', async () => {
      // The incident shape: the session dies mid-edit and a data request on a
      // client derived from the store's client (as `source.getClient()` does)
      // answers 401 with the API's invalid-session code. With the studio
      // handler in place that request is parked and the channel raises the
      // `unauthorized` claim that drives the logout; without it the
      // `ClientError` rejects straight into the pane that made the request.
      const workspace = createWorkspace({
        // Hostname-shaped, so the channel can attribute the claim to a project.
        projectId: `abc${Math.random().toString(36).slice(2, 8)}`,
      })
      const auth = createFakeAuthStore(createBareClient(workspace.projectId))
      const channel = createRequestErrorChannel()

      const {workspaces} = prepareConfig(
        {...workspace, auth},
        {
          createStudioRequestHandler: (getClient) =>
            createStudioRequestHandler({channel, getClient}),
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

    it('keeps the store methods reachable through the wrapped store', () => {
      const workspace = createWorkspace({})
      const logout = vi.fn(() => Promise.resolve())
      const auth = createFakeAuthStore(createBareClient(workspace.projectId), {logout})

      const {workspaces} = prepareConfig(
        {...workspace, auth},
        {createStudioRequestHandler: () => (request, next) => next(request)},
      )

      expect(workspaces[0].auth).not.toBe(auth)
      void workspaces[0].auth.logout!()
      expect(logout).toHaveBeenCalledOnce()
    })
  })
})
