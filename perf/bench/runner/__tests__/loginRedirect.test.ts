// @vitest-environment node
import {describe, expect, it} from 'vitest'

import {FAKE_SESSION_ID} from '../../constants'
import {AUTH_PROVIDERS} from '../../mock-api/project'
import {loginRedirectUrl} from '../browser'

const providerUrl = AUTH_PROVIDERS.providers[0].url

function loginUrl(origin: string): URL {
  const url = new URL(providerUrl)
  url.searchParams.set('origin', origin)
  url.searchParams.set('projectId', 'benchexp')
  url.searchParams.set('type', 'dual')
  return url
}

describe('loginRedirectUrl', () => {
  it('redirects a provider login back to the studio origin with the session id', () => {
    expect(loginRedirectUrl(loginUrl('https://localhost:3411/singleString/structure'))).toBe(
      `https://localhost:3411/singleString/structure#sid=${FAKE_SESSION_ID}`,
    )
  })

  it('never redirects off localhost', () => {
    expect(loginRedirectUrl(loginUrl('https://evil.example/'))).toBeUndefined()
  })

  it('ignores other URLs on the provider host and URLs without an origin', () => {
    expect(loginRedirectUrl(new URL('https://example.invalid/other'))).toBeUndefined()
    expect(loginRedirectUrl(new URL(providerUrl))).toBeUndefined()
    expect(loginRedirectUrl(new URL('https://cdn.sanity.io/images/x.png'))).toBeUndefined()
  })
})
