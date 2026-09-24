import {createClient, type RequestHandler, type SanityClient} from '@sanity/client'
import {firstValueFrom, type Observable, of} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {createMockAuthStore} from '../../store/authStore/createMockAuthStore'
import {
  type AuthState,
  type AuthStore,
  type HandleCallbackResult,
} from '../../store/authStore/types'
import {getAuthStore} from '../getAuthStore'
import {type SourceOptions} from '../types'

const passthrough: RequestHandler = (request, next) => next(request)
const createPassthroughHandler = () => passthrough

const LoginComponent = () => null

const CALLBACK_RESULT: HandleCallbackResult = {
  loginMethod: 'dual',
  flow: 'already-authenticated',
  success: true,
  durationMs: 0,
}

function createSource(auth: AuthStore): SourceOptions {
  return {name: 'test', projectId: 'abc123', dataset: 'test', auth}
}

function createBareClient() {
  return createClient({
    projectId: 'abc123',
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
      createStudioRequestHandler: createPassthroughHandler,
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
      createStudioRequestHandler: createPassthroughHandler,
    })

    const first = await firstValueFrom(auth.state)
    const second = await firstValueFrom(auth.state)
    expect(second.client).toBe(first.client)
  })

  it('resolves a pre-built store to one wrapped store, whichever source or factory asks', () => {
    // `AuthBoundary` keys its one-shot `handleCallbackUrl()` on the auth
    // store's identity, so the wrapper must be as stable as the store it
    // wraps — including across a re-created handler factory, matching the
    // memoized store the `AuthConfig` branch would return.
    const store = createPrebuiltStore(createBareClient())

    const a = getAuthStore(createSource(store), {
      createStudioRequestHandler: createPassthroughHandler,
    })
    const b = getAuthStore(createSource(store), {createStudioRequestHandler: () => passthrough})

    expect(a).not.toBe(store)
    expect(b).toBe(a)
  })

  it('keeps the store members reachable through the wrapped store', async () => {
    const logout = vi.fn(() => Promise.resolve())
    const handleCallbackUrl = vi.fn(() => Promise.resolve(CALLBACK_RESULT))
    const token = of('token')
    const store = createPrebuiltStore(createBareClient(), {
      logout,
      handleCallbackUrl,
      token,
      LoginComponent,
    })

    const auth = getAuthStore(createSource(store), {
      createStudioRequestHandler: createPassthroughHandler,
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
        return Promise.resolve(CALLBACK_RESULT)
      }
    }
    const store = new ClassAuthStore(createBareClient())

    const auth = getAuthStore(createSource(store), {
      createStudioRequestHandler: createPassthroughHandler,
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

  it('passes through a state whose client cannot be reconfigured', async () => {
    // A hand-written store may emit something that is not a full
    // `SanityClient`; without `withConfig` there is no way to add a handler,
    // and the state object is handed on unchanged.
    const bare = {config: () => ({projectId: 'abc123', dataset: 'test'})} as unknown as SanityClient
    const upstream = {client: bare, authenticated: true, currentUser: null}
    const auth = getAuthStore(
      createSource({state: of(upstream), logout: () => Promise.resolve()}),
      {
        createStudioRequestHandler: createPassthroughHandler,
      },
    )

    expect(await firstValueFrom(auth.state)).toBe(upstream)
  })
})
