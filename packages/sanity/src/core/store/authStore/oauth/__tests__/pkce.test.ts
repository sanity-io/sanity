import {describe, expect, it} from 'vitest'

import {createCodeChallenge, createCodeVerifier, createState} from '../pkce'

describe('pkce', () => {
  it('creates a 43 character url-safe verifier', () => {
    const verifier = createCodeVerifier()
    expect(verifier).toHaveLength(43)
    expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('creates a different verifier and state every time', () => {
    expect(createCodeVerifier()).not.toBe(createCodeVerifier())
    expect(createState()).not.toBe(createState())
  })

  it('derives the S256 challenge from RFC 7636 appendix B', async () => {
    // The verifier and challenge published in RFC 7636 appendix B.
    await expect(createCodeChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).resolves.toBe(
      'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
    )
  })
})
