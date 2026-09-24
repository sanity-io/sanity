import {type SanityClient} from '@sanity/client'
import {firstValueFrom, of} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {
  CALLBACK_RESULT,
  ClassAuthStore,
  createBareClient,
} from '../../../../../../test/fixtures/authStore'
import {createMockAuthStore} from '../../createMockAuthStore'
import {type AuthStore} from '../../types'
import {mapAuthStoreClients} from '../mapAuthStoreClients'

const LoginComponent = () => null

const tag = (client: SanityClient) => client.withConfig({apiVersion: '2026-01-01'})

describe('mapAuthStoreClients', () => {
  it('emits the mapped client', async () => {
    const auth = mapAuthStoreClients(
      createMockAuthStore({client: createBareClient(), currentUser: null}),
      tag,
    )

    const {client} = await firstValueFrom(auth.state)
    expect(client.config().apiVersion).toBe('2026-01-01')
  })

  it('maps each upstream client once, shared by every subscriber', async () => {
    const mapClient = vi.fn(tag)
    const auth = mapAuthStoreClients(
      createMockAuthStore({client: createBareClient(), currentUser: null}),
      mapClient,
    )

    const first = await firstValueFrom(auth.state)
    const second = await firstValueFrom(auth.state)
    expect(second.client).toBe(first.client)
    expect(mapClient).toHaveBeenCalledOnce()
  })

  it('passes a state through unchanged when its client maps to itself', async () => {
    const upstream = {client: createBareClient(), authenticated: true, currentUser: null}
    const auth = mapAuthStoreClients({state: of(upstream)}, (client) => client)

    expect(await firstValueFrom(auth.state)).toBe(upstream)
  })

  it('delegates every member of an object store', async () => {
    const logout = vi.fn(() => Promise.resolve())
    const handleCallbackUrl = vi.fn(() => Promise.resolve(CALLBACK_RESULT))
    const token = of('token')
    const store: AuthStore = {
      ...createMockAuthStore({client: createBareClient(), currentUser: null}),
      logout,
      handleCallbackUrl,
      token,
      LoginComponent,
    }

    const auth = mapAuthStoreClients(store, tag)

    await auth.logout!()
    expect(logout).toHaveBeenCalledOnce()
    await auth.handleCallbackUrl!()
    expect(handleCallbackUrl).toHaveBeenCalledOnce()
    expect(auth.token).toBe(token)
    expect(auth.LoginComponent).toBe(LoginComponent)
  })

  it('leaves optional members undefined when the store has none', () => {
    const auth = mapAuthStoreClients(
      createMockAuthStore({client: createBareClient(), currentUser: null}),
      tag,
    )

    expect(auth.logout).toBeUndefined()
    expect(auth.handleCallbackUrl).toBeUndefined()
    expect(auth.token).toBeUndefined()
    expect(auth.LoginComponent).toBeUndefined()
  })

  it('keeps prototype methods of a class-based store reachable, bound to the store', async () => {
    const store = new ClassAuthStore(createBareClient())

    const auth = mapAuthStoreClients(store, tag)

    expect(typeof auth.logout).toBe('function')
    await auth.logout!()
    expect(store.loggedOut).toBe(1)

    expect(typeof auth.handleCallbackUrl).toBe('function')
    await auth.handleCallbackUrl!()
    expect(store.callbacks).toBe(1)
  })
})
