import {describe, expect, test} from 'vitest'

import {
  buildChromeArgs,
  checkPassthroughArgs,
  switchName,
  type ChromeArgsOptions,
} from './chromeArgs'

const BASE: ChromeArgsOptions = {
  port: 9222,
  userDataDir: '/repo/node_modules/.cache/react-devtools-mcp/chrome-profile',
  headless: false,
  noSandbox: false,
  passthrough: [],
}

/** The value Chromium would end up with: the last occurrence of the switch wins. */
function effectiveValue(argv: readonly string[], name: string): string | undefined {
  let value: string | undefined
  for (const arg of argv) {
    if (switchName(arg) === name) {
      const eq = arg.indexOf('=')
      value = eq === -1 ? '' : arg.slice(eq + 1)
    }
  }
  return value
}

describe('switchName', () => {
  test.each([
    ['--remote-debugging-address=0.0.0.0', 'remote-debugging-address'],
    ['--remote-debugging-address', 'remote-debugging-address'],
    ['-remote-debugging-address=0.0.0.0', 'remote-debugging-address'],
    ['/remote-debugging-address=0.0.0.0', 'remote-debugging-address'],
    ['--Remote-Debugging-Port=9333', 'remote-debugging-port'],
    ['--window-size=1,1', 'window-size'],
    ['--no-sandbox', 'no-sandbox'],
  ])('%s sets %s', (arg, name) => {
    expect(switchName(arg)).toBe(name)
  })

  test.each([
    'http://localhost:3333/test',
    'remote-debugging-address=0.0.0.0',
    '',
    '--',
    '-',
    '--=',
  ])('%j is not a switch', (arg) => {
    expect(switchName(arg)).toBeUndefined()
  })
})

describe('checkPassthroughArgs', () => {
  test('accepts ordinary Chrome flags and positional arguments', () => {
    expect(() =>
      checkPassthroughArgs([
        '--disable-gpu',
        '--window-position=0,0',
        '--enable-features=NetworkServiceInProcess',
        '-incognito',
        '--remote-allow-origins=http://localhost:9222',
        '--profile-directory=Default',
        '--remote-debugging-targets=1',
        'http://localhost:3333/other',
        // Positional, not a switch: Chromium would try to open it as a url
        'remote-debugging-address=0.0.0.0',
      ]),
    ).not.toThrow()
    expect(() => checkPassthroughArgs([])).not.toThrow()
  })

  test.each([
    ['--remote-debugging-address=0.0.0.0', 'remote-debugging-address'],
    ['--remote-debugging-address', 'remote-debugging-address'],
    ['--remote-debugging-address=', 'remote-debugging-address'],
    ['-remote-debugging-address=::', 'remote-debugging-address'],
    ['/remote-debugging-address=0.0.0.0', 'remote-debugging-address'],
    ['--Remote-Debugging-Address=0.0.0.0', 'remote-debugging-address'],
    ['--remote-debugging-port=9333', 'remote-debugging-port'],
    ['--remote-debugging-port', 'remote-debugging-port'],
    ['--remote-debugging-pipe', 'remote-debugging-pipe'],
    ['--user-data-dir=/tmp/elsewhere', 'user-data-dir'],
    ['--user-data-dir', 'user-data-dir'],
    ['--headless', 'headless'],
    ['--headless=new', 'headless'],
    ['--headless=old', 'headless'],
  ])('rejects %s', (arg, name) => {
    expect(() => checkPassthroughArgs(['--disable-gpu', arg])).toThrow(
      `Chrome switch --${name} cannot be passed through: `,
    )
  })

  test('points at the launcher flag that replaces the switch', () => {
    expect(() => checkPassthroughArgs(['--remote-debugging-port=9333'])).toThrow('--port=<port>')
    expect(() => checkPassthroughArgs(['--headless=new'])).toThrow(
      "launcher's own --headless flag (before --)",
    )
    expect(() => checkPassthroughArgs(['--remote-debugging-address=0.0.0.0'])).toThrow('127.0.0.1')
  })

  test('rejects a bare -- which would turn the enforced switches into urls', () => {
    expect(() => checkPassthroughArgs(['--disable-gpu', '--', '--disable-extensions'])).toThrow(
      'Invalid chrome argument "--"',
    )
  })
})

describe('buildChromeArgs', () => {
  test('enforces the debugging endpoint and the profile, and starts on a blank page', () => {
    expect(buildChromeArgs(BASE)).toEqual([
      '--remote-debugging-port=9222',
      '--remote-debugging-address=127.0.0.1',
      '--user-data-dir=/repo/node_modules/.cache/react-devtools-mcp/chrome-profile',
      '--no-first-run',
      '--no-default-browser-check',
      '--window-size=1440,900',
      'about:blank',
    ])
  })

  test('adds --headless=new and --no-sandbox on request, before the blank page', () => {
    const argv = buildChromeArgs({...BASE, headless: true, noSandbox: true, port: 9333})
    expect(argv).toContain('--headless=new')
    expect(argv).toContain('--no-sandbox')
    expect(argv[0]).toBe('--remote-debugging-port=9333')
    expect(argv.at(-1)).toBe('about:blank')
  })

  test('puts passthrough arguments before every enforced switch', () => {
    const passthrough = ['--disable-gpu', '--window-size=1,1', 'http://localhost:3333/other']
    const argv = buildChromeArgs({...BASE, passthrough})

    expect(argv.slice(0, passthrough.length)).toEqual(passthrough)
    expect(argv.at(-1)).toBe('about:blank')
    // Both --window-size switches are present, and Chromium keeps the last one, the launcher's
    expect(argv.filter((arg) => switchName(arg) === 'window-size')).toHaveLength(2)
    expect(effectiveValue(argv, 'window-size')).toBe('1440,900')
  })

  test('the enforced switches win even when a managed switch slips through', () => {
    // checkPassthroughArgs rejects these; the ordering is the second line of defence
    const argv = buildChromeArgs({
      ...BASE,
      headless: true,
      passthrough: [
        '--remote-debugging-address=0.0.0.0',
        '--remote-debugging-port=9333',
        '--user-data-dir=/tmp/elsewhere',
        '--headless=old',
      ],
    })

    expect(effectiveValue(argv, 'remote-debugging-address')).toBe('127.0.0.1')
    expect(effectiveValue(argv, 'remote-debugging-port')).toBe('9222')
    expect(effectiveValue(argv, 'user-data-dir')).toBe(BASE.userDataDir)
    expect(effectiveValue(argv, 'headless')).toBe('new')
  })
})
