import {createClient, type RequestHandler, type SanityClient} from '@sanity/client'
import {firstValueFrom, type Observable, of} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {createMockAuthStore} from '../../store/authStore/createMockAuthStore'
import {type AuthState, type AuthStore} from '../../store/authStore/types'
import {getAuthStore} from '../getAuthStore'
import {type SourceOptions} from '../types'

const passthrough: RequestHandler = (request, next) => next(request)

function createSource(auth: AuthStore): SourceOptions {
  return {
    name: 'test',
    projectId: `test-${Math.random().toString(36).slice(2)}`,
    dataset: 'test',
    auth,
  }
}

function createBareClient() {
  return createClient({
    projectId: `test-${Math.random().toString(36).slice(2)}`,
    dataset: 'test',
    apiVersion: '2025-01-01',
    useCdn: false,
  })
}

// The pre-built store shape under test: `createMockAuthStore` plus the
// `logout` a store must have for the studio to complete a forced logout.
function createPrebuiltStore(client: SanityClient, extra: Partial<AuthStore> = {}): AuthStore {
  return {
    ...createMockAuthStore({client, currentUser: null}),
    logout: () => Promise.resolve(),
    ...extra,
  }
}

// A pre-built `AuthStore` (the pre-v3.15 `auth: createAuthStore({...})`
// recipe, still in use by SSO deploys) builds its clients before
// `prepareConfig` runs, so the handler cannot be injected through the client
// factory the way it is for a plain `AuthConfig`. Without it, an
// invalid-session 401 on a data request is never claimed: nothing forces a
// logout, and the error surfaces in whichever pane made the request.
describe('getAuthStore — pre-built auth store', () => {
  it('attaches the studio request handler to the clients the store emits', async () => {
    const seen: string[] = []
    const requestHandler: RequestHandler = (request, next) => {
      seen.push(request.url)
      return next(request)
    }
    const auth = getAuthStore(createSource(createPrebuiltStore(createBareClient())), {
      createStudioRequestHandler: () => requestHandler,
    })

    const {client} = await firstValueFrom(auth.state)
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
    const auth = getAuthStore(
      createSource(
        createPrebuiltStore(createBareClient().withConfig({requestHandler: storeHandler})),
      ),
      {createStudioRequestHandler: () => studioHandler},
    )

    const {client} = await firstValueFrom(auth.state)
    await client.config().requestHandler!({url: 'https://example.test/x'}, () =>
      Promise.resolve({}),
    )
    expect(order).toEqual(['studio:before', 'store:before', 'store:after', 'studio:after'])
  })

  it('leaves the emitted client alone when the store cannot complete a forced logout', async () => {
    // The studio's response to a claimed invalid-session 401 is to park the
    // request and log the user out. A store without `logout` would just
    // leave the request pending, so its clients keep surfacing the error.
    const store = createMockAuthStore({client: createBareClient(), currentUser: null})
    const auth = getAuthStore(createSource(store), {
      createStudioRequestHandler: () => passthrough,
    })

    expect(auth).toBe(store)
    const {client} = await firstValueFrom(auth.state)
    expect(client.config().requestHandler).toBeUndefined()
  })

  it('passes the store through untouched when no studio handler is configured', () => {
    const store = createPrebuiltStore(createBareClient())

    expect(getAuthStore(createSource(store), {})).toBe(store)
  })

  it('emits one wrapped client per upstream client, shared by every subscriber', async () => {
    const auth = getAuthStore(createSource(createPrebuiltStore(createBareClient())), {
      createStudioRequestHandler: () => passthrough,
    })

    const first = await firstValueFrom(auth.state)
    const second = await firstValueFrom(auth.state)
    expect(second.client).toBe(first.client)
  })

  it('resolves sources that share a pre-built store to the same wrapped store', () => {
    const store = createPrebuiltStore(createBareClient())
    const createStudioRequestHandler = () => passthrough

    const a = getAuthStore(createSource(store), {createStudioRequestHandler})
    const b = getAuthStore(createSource(store), {createStudioRequestHandler})

    expect(a).not.toBe(store)
    expect(b).toBe(a)
  })

  it('wraps a store once per handler factory', () => {
    // A remounted `WorkspacesProvider` brings a new channel and therefore a
    // new factory; its requests must not route into the old channel.
    const store = createPrebuiltStore(createBareClient())

    const a = getAuthStore(createSource(store), {createStudioRequestHandler: () => passthrough})
    const b = getAuthStore(createSource(store), {createStudioRequestHandler: () => passthrough})

    expect(b).not.toBe(a)
  })

  it('keeps the store methods reachable through the wrapped store', async () => {
    const logout = vi.fn(() => Promise.resolve())
    const handleCallbackUrl = vi.fn(() =>
      Promise.resolve({
        loginMethod: 'dual' as const,
        flow: 'already-authenticated' as const,
        success: true,
        durationMs: 0,
      }),
    )
    const token = of('token')
    const LoginComponent = () => null
    const store = createPrebuiltStore(createBareClient(), {
      logout,
      handleCallbackUrl,
      token,
      LoginComponent,
    })

    const auth = getAuthStore(createSource(store), {
      createStudioRequestHandler: () => passthrough,
    })

    expect(auth).not.toBe(store)
    await auth.logout!()
    expect(logout).toHaveBeenCalledOnce()
    await auth.handleCallbackUrl!()
    expect(handleCallbackUrl).toHaveBeenCalledOnce()
    expect(auth.token).toBe(token)
    expect(auth.LoginComponent).toBe(LoginComponent)
  })

  it('keeps prototype methods of a class-based store reachable, bound to the store', async () => {
    // `AuthStore` is duck-typed, so a class instance is a valid store. Its
    // methods live on the prototype and read `this`; an object spread would
    // drop them, letting the handler attach while `logout` disappears — a
    // claimed 401 would then park forever with nothing to log the user out.
    class ClassAuthStore implements AuthStore {
      state: Observable<AuthState>
      loggedOut = 0
      callbacks = 0

      constructor(client: SanityClient) {
        this.state = of({client, authenticated: true, currentUser: null})
      }

      logout() {
        this.loggedOut += 1
        return Promise.resolve()
      }

      handleCallbackUrl() {
        this.callbacks += 1
        return Promise.resolve({
          loginMethod: 'dual' as const,
          flow: 'already-authenticated' as const,
          success: true,
          durationMs: 0,
        })
      }
    }
    const store = new ClassAuthStore(createBareClient())

    const auth = getAuthStore(createSource(store), {
      createStudioRequestHandler: () => passthrough,
    })

    expect(auth).not.toBe(store)
    const {client} = await firstValueFrom(auth.state)
    expect(client.config().requestHandler).toBeDefined()

    expect(typeof auth.logout).toBe('function')
    await auth.logout!()
    expect(store.loggedOut).toBe(1)

    expect(typeof auth.handleCallbackUrl).toBe('function')
    await auth.handleCallbackUrl!()
    expect(store.callbacks).toBe(1)
  })

  it('leaves clients that cannot be reconfigured as they are', async () => {
    // A custom `unstable_clientFactory` may hand out a client without
    // `withConfig`; there is no way to add a handler to it after the fact.
    const bare = {config: () => ({projectId: 'x', dataset: 'y'})} as unknown as SanityClient
    const auth = getAuthStore(createSource(createPrebuiltStore(bare)), {
      createStudioRequestHandler: () => passthrough,
    })

    const {client} = await firstValueFrom(auth.state)
    expect(client).toBe(bare)
  })
})
