import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {type WorkspaceOptions} from '../../../../config/types'

// Credentials handed to the studio in the URL hash (`#sid=` after a login
// redirect, `#token=` for token auth links) must leave the address bar and the
// session history even when the studio fails to boot. A crash shown on screen
// is exactly when people copy the URL into a bug report or share their screen.

const SESSION_ID = 'sid-abcdefghijklmnopqrstuvwxyz'
const TOKEN = 'tok-abcdefghijklmnopqrstuvwxyz0123456789'
const CLAIM_URL = 'https://www.sanity.io/manage/claim/some-claim-token'

// A field pointing at a type that does not exist: `prepareConfig` throws a
// `SchemaError` while resolving the workspace, before it creates the auth store.
const brokenWorkspace: WorkspaceOptions = {
  name: 'broken',
  basePath: '/',
  projectId: 'hashcreds',
  dataset: 'test',
  schema: {
    types: [
      {
        type: 'document',
        name: 'post',
        fields: [{name: 'author', type: 'reference', to: [{type: 'missing'}]}],
      },
    ],
  },
}

async function bootWithBrokenSchema() {
  // The hash is read when the auth modules evaluate, so load them fresh after
  // the hash is set, the way a page load after a redirect would.
  const {prepareConfig} = await import('../../../../config/prepareConfig')
  const {SchemaError} = await import('../../../../config/SchemaError')
  expect(() => prepareConfig([brokenWorkspace])).toThrow(SchemaError)
}

// Cold imports of the config modules are slow, and each test re-imports them.
describe('credentials in the URL hash when the studio fails to boot', {timeout: 60_000}, () => {
  let consoleSpies: ReturnType<typeof vi.spyOn>[]

  beforeEach(() => {
    vi.resetModules()
    consoleSpies = [
      vi.spyOn(console, 'error').mockImplementation(() => {}),
      vi.spyOn(console, 'warn').mockImplementation(() => {}),
    ]
  })

  afterEach(() => {
    for (const spy of consoleSpies) spy.mockRestore()
    window.location.hash = ''
    delete globalThis.__SANITY_AUTH_HASH_PARAMS__
  })

  it('removes #sid= from the URL even when the schema fails to compile', async () => {
    window.location.hash = `#sid=${SESSION_ID}`

    await bootWithBrokenSchema()

    expect(window.location.href).not.toContain(SESSION_ID)
  })

  it('removes #token= from the URL even when the schema fails to compile', async () => {
    window.location.hash = `#token=${TOKEN}`

    await bootWithBrokenSchema()

    expect(window.location.href).not.toContain(TOKEN)
  })

  it('removes #claim= from the URL even when the schema fails to compile', async () => {
    window.location.hash = `#claim=${encodeURIComponent(CLAIM_URL)}`

    await bootWithBrokenSchema()

    expect(window.location.hash).toBe('')
  })

  it('keeps unrelated hash params when removing the token', async () => {
    window.location.hash = `#token=${TOKEN}&keep=me`

    await bootWithBrokenSchema()

    expect(window.location.hash).toBe('#keep=me')
  })

  it('still hands a token that was removed at load to the auth store', async () => {
    window.location.hash = `#token=${TOKEN}`

    const {consumeHashToken} = await import('../hashToken')
    expect(window.location.href).not.toContain(TOKEN)

    expect(consumeHashToken()).toBe(TOKEN)
    // One-shot, like the session id: a later call must not replay it.
    expect(consumeHashToken()).toBeUndefined()
  })

  it('removes a token the host restored to the hash after load when it is consumed', async () => {
    window.location.hash = `#token=${TOKEN}`
    const {consumeHashToken} = await import('../hashToken')

    // A host router restoring the hash it cached before load (vercel/next.js#91819)
    window.location.hash = `#token=${TOKEN}&keep=me`

    expect(consumeHashToken()).toBe(TOKEN)
    expect(window.location.hash).toBe('#keep=me')
  })

  it('still reads a token that arrives in a later hash change', async () => {
    window.location.hash = ''
    const {consumeHashToken} = await import('../hashToken')

    window.location.hash = `#token=${TOKEN}`

    expect(consumeHashToken()).toBe(TOKEN)
    expect(window.location.href).not.toContain(TOKEN)
  })

  it('still hands a claim URL that was removed at load to the auth store', async () => {
    window.location.hash = `#claim=${encodeURIComponent(CLAIM_URL)}`

    const {consumeHashClaim} = await import('../hashClaim')
    expect(window.location.hash).toBe('')

    expect(consumeHashClaim()).toBe(CLAIM_URL)
    expect(consumeHashClaim()).toBeUndefined()
  })

  it('removes a claim URL the host restored to the hash after load when it is consumed', async () => {
    window.location.hash = `#claim=${encodeURIComponent(CLAIM_URL)}`
    const {consumeHashClaim} = await import('../hashClaim')

    // A host router restoring the hash it cached before load (vercel/next.js#91819)
    window.location.hash = `#claim=${encodeURIComponent(CLAIM_URL)}&keep=me`

    expect(consumeHashClaim()).toBe(CLAIM_URL)
    expect(window.location.hash).toBe('#keep=me')
  })

  it('takes the token and claim URL the studio HTML stashed before the bundle loaded', async () => {
    globalThis.__SANITY_AUTH_HASH_PARAMS__ = {token: TOKEN, claim: encodeURIComponent(CLAIM_URL)}

    const {consumeHashToken} = await import('../hashToken')
    const {consumeHashClaim} = await import('../hashClaim')

    expect(consumeHashToken()).toBe(TOKEN)
    expect(consumeHashClaim()).toBe(CLAIM_URL)
    expect(globalThis.__SANITY_AUTH_HASH_PARAMS__).toEqual({})
  })

  it('validates stashed values like hash params', async () => {
    globalThis.__SANITY_AUTH_HASH_PARAMS__ = {
      token: 'too-short',
      claim: encodeURIComponent('https://evil.example.com/manage/claim/some-claim-token'),
    }

    const {consumeHashToken} = await import('../hashToken')
    const {consumeHashClaim} = await import('../hashClaim')

    expect(consumeHashToken()).toBeUndefined()
    expect(consumeHashClaim()).toBeUndefined()
  })
})
