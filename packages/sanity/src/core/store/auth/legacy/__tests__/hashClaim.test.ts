import {afterEach, describe, expect, it} from 'vitest'

import {consumeHashClaim} from '../hashClaim'

const CLAIM_URL = 'https://www.sanity.io/manage/claim/some-claim-token'
const ROBOT_TOKEN = 'sk'.repeat(32)

describe('consumeHashClaim', () => {
  afterEach(() => {
    history.replaceState(null, '', '/')
  })

  it('consumes a valid claim URL and strips it from the hash', () => {
    window.location.hash = `#claim=${encodeURIComponent(CLAIM_URL)}`
    expect(consumeHashClaim()).toBe(CLAIM_URL)
    expect(window.location.hash).toBe('')
  })

  it('accepts the staging host', () => {
    const stagingUrl = 'https://www.sanity.work/manage/claim/some-claim-token'
    window.location.hash = `#claim=${encodeURIComponent(stagingUrl)}`
    expect(consumeHashClaim()).toBe(stagingUrl)
  })

  it('leaves the token param for the token reader', () => {
    window.location.hash = `#token=${ROBOT_TOKEN}&claim=${encodeURIComponent(CLAIM_URL)}`
    expect(consumeHashClaim()).toBe(CLAIM_URL)
    expect(window.location.hash).toContain(`token=${ROBOT_TOKEN}`)
    expect(window.location.hash).not.toContain('claim=')
  })

  it('leaves unknown params untouched', () => {
    window.location.hash = `#foo=bar&claim=${encodeURIComponent(CLAIM_URL)}&baz=qux`
    expect(consumeHashClaim()).toBe(CLAIM_URL)
    expect(window.location.hash).toBe('#foo=bar&baz=qux')
  })

  it('returns undefined and leaves the hash alone when there is no claim param', () => {
    window.location.hash = '#foo=bar'
    expect(consumeHashClaim()).toBeUndefined()
    expect(window.location.hash).toBe('#foo=bar')
  })

  it('ignores params whose name merely ends in claim', () => {
    window.location.hash = `#myclaim=${encodeURIComponent(CLAIM_URL)}`
    expect(consumeHashClaim()).toBeUndefined()
    expect(window.location.hash).toBe(`#myclaim=${encodeURIComponent(CLAIM_URL)}`)
  })

  it('ignores claim= embedded inside another value', () => {
    window.location.hash = '#foo=xclaim=y'
    expect(consumeHashClaim()).toBeUndefined()
    expect(window.location.hash).toBe('#foo=xclaim=y')
  })

  it.each([
    ['non-https URL', 'http://www.sanity.io/manage/claim/some-claim-token'],
    ['non-Sanity host', 'https://evil.example.com/manage/claim/some-claim-token'],
    ['host suffix impersonation', 'https://evilsanity.io/manage/claim/some-claim-token'],
    ['missing claim token', 'https://www.sanity.io/manage/claim/'],
    ['no claim path segment', 'https://www.sanity.io/manage/some-claim-token'],
    ['javascript URL', 'javascript:alert(1)'],
    ['not a URL', 'some-claim-token'],
  ])('discards a %s but still strips it from the hash', (_label, value) => {
    window.location.hash = `#claim=${encodeURIComponent(value)}`
    expect(consumeHashClaim()).toBeUndefined()
    expect(window.location.hash).toBe('')
  })

  it('discards malformed percent-encoding but still strips it from the hash', () => {
    window.location.hash = '#claim=%E0%A4%A'
    expect(consumeHashClaim()).toBeUndefined()
    expect(window.location.hash).toBe('')
  })
})
