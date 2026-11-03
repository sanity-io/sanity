import {describe, expect, test} from 'vitest'

import {describeUrl, parseUrl, routeToken, type TokenRoutingFlags} from './tokenRouting'

const EXAMPLE = 'http://localhost:3333/test'
const TOKEN = 'sk-s3cret token/with?chars'
const ENCODED = encodeURIComponent(TOKEN)
const NO_FLAGS: TokenRoutingFlags = {injectToken: false, injectTokenInsecureHttp: false}
const INJECT: TokenRoutingFlags = {injectToken: true, injectTokenInsecureHttp: false}
const INSECURE: TokenRoutingFlags = {injectToken: false, injectTokenInsecureHttp: true}

function url(value: string): URL {
  return new URL(value)
}

describe('parseUrl', () => {
  test('accepts absolute http(s) urls', () => {
    expect(parseUrl('http://localhost:3333/test', EXAMPLE).href).toBe('http://localhost:3333/test')
    expect(parseUrl('https://studio.example.com/desk?x=1#y', EXAMPLE).href).toBe(
      'https://studio.example.com/desk?x=1#y',
    )
  })

  test.each(['not a url', '/relative/path', ''])('rejects %j without echoing it', (value) => {
    expect(() => parseUrl(value, EXAMPLE)).toThrow(
      `Invalid url: expected an absolute http(s) url such as ${EXAMPLE}`,
    )
  })

  test.each([
    ['file:///etc/passwd', 'file:'],
    ['data:text/html,s3cret', 'data:'],
    ['mailto:someone@example.com', 'mailto:'],
    ['javascript:alert(1)', 'javascript:'],
    ['ftp://alice:s3cret@host/', 'ftp:'],
    // A bare host:port parses as a scheme, not as a host
    ['localhost:3333/test', 'localhost:'],
  ])('rejects the %s scheme by name only', (value, scheme) => {
    let message = ''
    try {
      parseUrl(value, EXAMPLE)
    } catch (error) {
      message = error instanceof Error ? error.message : String(error)
    }
    expect(message).toContain(`got the "${scheme}" scheme`)
    expect(message).not.toContain('s3cret')
    expect(message).not.toContain('passwd')
    expect(message).not.toContain('someone')
    expect(message).not.toContain('alice')
  })

  test.each([
    'https://alice:s3cretpw@example.com/path?q=1',
    'http://alice:s3cretpw@localhost:3333/test',
    'https://alice@example.com/',
  ])('rejects credentials in %s naming only the origin', (value) => {
    let message = ''
    try {
      parseUrl(value, EXAMPLE)
    } catch (error) {
      message = error instanceof Error ? error.message : String(error)
    }
    expect(message).toMatch(/^Invalid url for https?:\/\/[^/]+: credentials in the url/)
    expect(message).not.toContain('s3cretpw')
    expect(message).not.toContain('alice')
  })
})

describe('describeUrl', () => {
  test('keeps origin, path and query', () => {
    expect(describeUrl(url('http://localhost:3333/test/structure/author?x=1&y=2'))).toBe(
      'http://localhost:3333/test/structure/author?x=1&y=2',
    )
  })

  test('replaces a fragment with an ellipsis', () => {
    expect(describeUrl(url('http://localhost:3333/test?x=1#token=s3cret'))).toBe(
      'http://localhost:3333/test?x=1#…',
    )
  })
})

describe('routeToken', () => {
  test.each([
    ['http://localhost:3333/test', NO_FLAGS],
    ['https://studio.example.com/', INJECT],
    ['http://studio.example.com/', INSECURE],
  ])('never injects when there is no token (%s)', (value, flags) => {
    expect(routeToken(url(value), undefined, flags)).toEqual({
      kind: 'open',
      url: value,
      signIn: false,
    })
    expect(routeToken(url(value), '', flags)).toEqual({kind: 'open', url: value, signIn: false})
  })

  test.each([
    'http://localhost:3333/test',
    'http://127.0.0.1:3333/test/structure/author?x=1',
    'http://[::1]:3333/test',
    'https://localhost:3333/test',
    'https://127.0.0.1/',
  ])('injects automatically on the loopback origin %s', (value) => {
    expect(routeToken(url(value), TOKEN, NO_FLAGS)).toEqual({
      kind: 'open',
      url: `${value}#token=${ENCODED}`,
      signIn: true,
    })
  })

  test.each([
    ['http://localhost:3333/test#', NO_FLAGS, 'http://localhost:3333/test#token='],
    ['http://localhost:3333/test?x=1#', NO_FLAGS, 'http://localhost:3333/test?x=1#token='],
    ['https://studio.example.com/desk#', INJECT, 'https://studio.example.com/desk#token='],
  ])(
    'treats a bare trailing # in %s as no fragment and never doubles it',
    (value, flags, prefix) => {
      const result = routeToken(url(value), TOKEN, flags)
      expect(result).toEqual({kind: 'open', url: `${prefix}${ENCODED}`, signIn: true})
      expect(JSON.stringify(result)).not.toContain('##')
    },
  )

  test('leaves a url that already has a fragment alone, with a notice', () => {
    const result = routeToken(url('http://localhost:3333/test#existing'), TOKEN, INJECT)
    expect(result).toEqual({
      kind: 'open',
      url: 'http://localhost:3333/test#existing',
      signIn: false,
      notice: 'STUDIO_AUTH_TOKEN was not injected: the url already has a fragment.',
    })
  })

  describe('non-loopback https', () => {
    const value = 'https://studio.example.com/desk'

    test('opens signed out with a notice without a flag', () => {
      expect(routeToken(url(value), TOKEN, NO_FLAGS)).toEqual({
        kind: 'open',
        url: value,
        signIn: false,
        notice:
          'STUDIO_AUTH_TOKEN was not injected: https://studio.example.com is not a loopback ' +
          'origin. Pass --inject-token to sign in there anyway.',
      })
    })

    test.each([INJECT, INSECURE])('injects with %o', (flags) => {
      expect(routeToken(url(value), TOKEN, flags)).toEqual({
        kind: 'open',
        url: `${value}#token=${ENCODED}`,
        signIn: true,
      })
    })
  })

  describe('non-loopback plaintext http', () => {
    const value = 'http://studio.example.com/desk'

    test('opens signed out with a notice without a flag', () => {
      expect(routeToken(url(value), TOKEN, NO_FLAGS)).toEqual({
        kind: 'open',
        url: value,
        signIn: false,
        notice:
          'STUDIO_AUTH_TOKEN was not injected: http://studio.example.com is not a loopback ' +
          'origin and uses plaintext http. Pass --inject-token-insecure-http to sign in there anyway.',
      })
    })

    test('refuses --inject-token alone', () => {
      expect(routeToken(url(value), TOKEN, INJECT)).toEqual({
        kind: 'refuse',
        reason:
          'Refusing to send STUDIO_AUTH_TOKEN to http://studio.example.com over plaintext http. ' +
          'Use an https url, or pass --inject-token-insecure-http instead of --inject-token if you ' +
          'really must.',
      })
    })

    test('injects only with --inject-token-insecure-http', () => {
      expect(routeToken(url(value), TOKEN, INSECURE)).toEqual({
        kind: 'open',
        url: `${value}#token=${ENCODED}`,
        signIn: true,
      })
      expect(
        routeToken(url(value), TOKEN, {injectToken: true, injectTokenInsecureHttp: true}),
      ).toEqual({kind: 'open', url: `${value}#token=${ENCODED}`, signIn: true})
    })
  })

  test('never puts the raw token into a notice or refusal', () => {
    for (const [value, flags] of [
      ['https://studio.example.com/', NO_FLAGS],
      ['http://studio.example.com/', NO_FLAGS],
      ['http://studio.example.com/', INJECT],
      ['http://localhost:3333/test#existing', INJECT],
    ] as const) {
      const result = routeToken(url(value), TOKEN, flags)
      const text = result.kind === 'refuse' ? result.reason : (result.notice ?? '')
      expect(text).not.toContain('s3cret')
    }
  })
})
