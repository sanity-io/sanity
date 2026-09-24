import {type RequestHandler, type SanityClient} from '@sanity/client'
import {firstValueFrom, of} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {
  ClassAuthStore,
  createBareClient,
  createPrebuiltStore,
  passthroughRequestHandler,
} from '../../../../test/fixtures/authStore'
import {createMockAuthStore} from '../../store/authStore/createMockAuthStore'
import {type AuthStore} from '../../store/authStore/types'
import {getAuthStore} from '../getAuthStore'
import {type SourceOptions} from '../types'

const createPassthroughHandler = () => passthroughRequestHandler

function createSource(auth: AuthStore): SourceOptions {
  return {name: 'test', projectId: 'abc123', dataset: 'test', auth}
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

  it('leaves the store alone when it cannot complete a forced logout', async () => {
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

  it('resolves a pre-built store to one wrapped store, whichever source or factory asks', () => {
    // `AuthBoundary` keys its one-shot `handleCallbackUrl()` on the auth
    // store's identity, so the wrapper must be as stable as the store it wraps.
    const store = createPrebuiltStore(createBareClient())

    const a = getAuthStore(createSource(store), {
      createStudioRequestHandler: createPassthroughHandler,
    })
    const b = getAuthStore(createSource(store), {
      createStudioRequestHandler: () => passthroughRequestHandler,
    })

    expect(a).not.toBe(store)
    expect(b).toBe(a)
  })

  it('keeps a class-based store loggable-out once its clients carry the handler', async () => {
    // The `logout` gate reads the prototype; the wrapper must too, or the
    // handler attaches while `logout` disappears and a claimed 401 parks
    // forever with nothing to log the user out.
    const store = new ClassAuthStore(createBareClient())

    const auth = getAuthStore(createSource(store), {
      createStudioRequestHandler: createPassthroughHandler,
    })

    const {client} = await firstValueFrom(auth.state)
    expect(client.config().requestHandler).toBeDefined()
    expect(typeof auth.logout).toBe('function')
    await auth.logout!()
    expect(store.loggedOut).toBe(1)
  })

  it('passes through a state whose client cannot be reconfigured', async () => {
    // A hand-written store may emit something that is not a full
    // `SanityClient`; without `withConfig` there is no seam for a handler.
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
