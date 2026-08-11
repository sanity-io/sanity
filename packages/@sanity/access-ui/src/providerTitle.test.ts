import {describe, expect, it} from 'vitest'

import {getProviderTitle} from './providerTitle'

describe('getProviderTitle', () => {
  it.each([
    {provider: 'google', expected: 'Google'},
    {provider: 'github', expected: 'GitHub'},
    {provider: 'sanity', expected: 'Sanity'},
    {provider: 'vercel', expected: 'Vercel'},
    {provider: 'saml-org123', expected: 'SAML/SSO'},
    {provider: 'unknown', expected: undefined},
    {provider: undefined, expected: undefined},
  ])('$provider → $expected', ({provider, expected}) => {
    expect(getProviderTitle(provider)).toBe(expected)
  })
})
