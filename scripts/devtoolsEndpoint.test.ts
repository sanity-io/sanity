import {describe, expect, test} from 'vitest'

import {
  advertisedBrowserEndpoint,
  announcedBrowserEndpoint,
  blankPageEndpoint,
  browserTargetPath,
  getBrowserName,
  isAnnouncedBrowser,
  isEndpointAt,
  parseLauncherState,
} from './devtoolsEndpoint'

const UUID = '42a60490-840a-4d3d-9fa2-b97652f42ab7'
const ANNOUNCED = `ws://127.0.0.1:9222/devtools/browser/${UUID}`
const STDERR = [
  '[12007:12029:1009/163640.521798:ERROR:dbus/bus.cc:405] Failed to connect to the bus',
  '',
  `DevTools listening on ${ANNOUNCED}`,
  '[12007:12007:1009/163640.594997:ERROR:dbus/object_proxy.cc:572] Failed to call method',
  '',
].join('\n')

function versionInfo(webSocketDebuggerUrl: string): Record<string, string> {
  return {
    'Browser': 'Chrome/148.0.7778.96',
    'Protocol-Version': '1.3',
    'webSocketDebuggerUrl': webSocketDebuggerUrl,
  }
}

describe('announcedBrowserEndpoint', () => {
  test('finds the announcement between Chrome’s other stderr output', () => {
    expect(announcedBrowserEndpoint(STDERR)).toBe(ANNOUNCED)
  })

  test('takes the last announcement when Chrome was restarted into the same log', () => {
    const restarted = `${STDERR}\nDevTools listening on ws://127.0.0.1:9222/devtools/browser/second\n`
    expect(announcedBrowserEndpoint(restarted)).toBe('ws://127.0.0.1:9222/devtools/browser/second')
  })

  test('stops at the end of the line, including Windows line endings', () => {
    expect(announcedBrowserEndpoint(`DevTools listening on ${ANNOUNCED}\r\nnext line`)).toBe(
      ANNOUNCED,
    )
  })

  test('is null for an empty log or one without an announcement', () => {
    expect(announcedBrowserEndpoint('')).toBeNull()
    expect(announcedBrowserEndpoint('Cannot start http server for devtools.\n')).toBeNull()
  })
})

describe('advertisedBrowserEndpoint', () => {
  test('reads webSocketDebuggerUrl from /json/version', () => {
    expect(advertisedBrowserEndpoint(versionInfo(ANNOUNCED))).toBe(ANNOUNCED)
  })

  test('is null when the answer is not shaped like Chrome’s', () => {
    expect(advertisedBrowserEndpoint({})).toBeNull()
    expect(advertisedBrowserEndpoint({webSocketDebuggerUrl: 42})).toBeNull()
    expect(advertisedBrowserEndpoint(null)).toBeNull()
    expect(advertisedBrowserEndpoint('ws://127.0.0.1:9222/devtools/browser/x')).toBeNull()
  })
})

describe('browserTargetPath', () => {
  test('is the /devtools/browser/<uuid> path of a browser target url', () => {
    expect(browserTargetPath(ANNOUNCED)).toBe(`/devtools/browser/${UUID}`)
    expect(browserTargetPath(`ws://[::1]:9222/devtools/browser/${UUID}`)).toBe(
      `/devtools/browser/${UUID}`,
    )
  })

  test('is null for other paths, other schemes and non-urls', () => {
    expect(browserTargetPath(`ws://127.0.0.1:9222/devtools/page/${UUID}`)).toBeNull()
    expect(browserTargetPath(`http://127.0.0.1:9222/devtools/browser/${UUID}`)).toBeNull()
    expect(browserTargetPath('not a url')).toBeNull()
    expect(browserTargetPath(null)).toBeNull()
  })
})

describe('isEndpointAt', () => {
  test('matches the announced loopback address and port', () => {
    expect(isEndpointAt(ANNOUNCED, '127.0.0.1', 9222)).toBe(true)
  })

  test('tells the IPv6 fallback and other ports apart', () => {
    expect(isEndpointAt(`ws://[::1]:9222/devtools/browser/${UUID}`, '127.0.0.1', 9222)).toBe(false)
    expect(isEndpointAt(`ws://127.0.0.1:9333/devtools/browser/${UUID}`, '127.0.0.1', 9222)).toBe(
      false,
    )
    expect(isEndpointAt('not a url', '127.0.0.1', 9222)).toBe(false)
  })

  test('accounts for the default ports that URL leaves out', () => {
    expect(isEndpointAt(`ws://127.0.0.1:80/devtools/browser/${UUID}`, '127.0.0.1', 80)).toBe(true)
    expect(isEndpointAt(`ws://127.0.0.1/devtools/browser/${UUID}`, '127.0.0.1', 80)).toBe(true)
    expect(isEndpointAt(`wss://127.0.0.1/devtools/browser/${UUID}`, '127.0.0.1', 443)).toBe(true)
    expect(isEndpointAt(`ws://127.0.0.1:80/devtools/browser/${UUID}`, '127.0.0.1', 9222)).toBe(
      false,
    )
  })
})

describe('parseLauncherState', () => {
  test('reads a complete record', () => {
    expect(
      parseLauncherState(JSON.stringify({pid: 4242, port: 9222, endpoint: ANNOUNCED})),
    ).toEqual({pid: 4242, port: 9222, endpoint: ANNOUNCED})
  })

  test('is null for malformed, incomplete or implausible records', () => {
    expect(parseLauncherState('')).toBeNull()
    expect(parseLauncherState('not json')).toBeNull()
    expect(parseLauncherState(JSON.stringify({port: 9222, endpoint: ANNOUNCED}))).toBeNull()
    expect(parseLauncherState(JSON.stringify({pid: 0, port: 9222, endpoint: ANNOUNCED}))).toBeNull()
    expect(parseLauncherState(JSON.stringify({pid: 4242, port: 9222}))).toBeNull()
    expect(
      parseLauncherState(JSON.stringify({pid: 4242, port: 9222, endpoint: 'http://x/'})),
    ).toBeNull()
  })
})

describe('isAnnouncedBrowser', () => {
  test('accepts the endpoint whose advertised target matches the announcement', () => {
    expect(isAnnouncedBrowser(ANNOUNCED, versionInfo(ANNOUNCED))).toBe(true)
  })

  test('ignores host and port differences, which only reflect the request’s Host header', () => {
    expect(
      isAnnouncedBrowser(ANNOUNCED, versionInfo(`ws://localhost:9222/devtools/browser/${UUID}`)),
    ).toBe(true)
    expect(
      isAnnouncedBrowser(
        `ws://[::1]:9222/devtools/browser/${UUID}`,
        versionInfo(`ws://127.0.0.1:9222/devtools/browser/${UUID}`),
      ),
    ).toBe(true)
  })

  test('rejects a listener that advertises another browser', () => {
    expect(
      isAnnouncedBrowser(ANNOUNCED, versionInfo('ws://127.0.0.1:9222/devtools/browser/other')),
    ).toBe(false)
  })

  test('rejects a listener that merely answers 200 with a Chrome-looking body', () => {
    expect(isAnnouncedBrowser(ANNOUNCED, {Browser: 'Chrome/148.0.7778.96'})).toBe(false)
    expect(isAnnouncedBrowser(ANNOUNCED, {})).toBe(false)
    expect(isAnnouncedBrowser(ANNOUNCED, 'ok')).toBe(false)
  })

  test('rejects everything when nothing was announced, never trusting a lone /json/version', () => {
    expect(isAnnouncedBrowser(null, versionInfo(ANNOUNCED))).toBe(false)
    expect(isAnnouncedBrowser('garbage', versionInfo('garbage'))).toBe(false)
  })
})

describe('blankPageEndpoint', () => {
  const blank = {
    type: 'page',
    url: 'about:blank',
    webSocketDebuggerUrl: 'ws://127.0.0.1:9222/devtools/page/BLANK',
  }
  const studio = {
    type: 'page',
    url: 'http://localhost:3333/test',
    webSocketDebuggerUrl: 'ws://127.0.0.1:9222/devtools/page/STUDIO',
  }
  const worker = {type: 'service_worker', url: 'about:blank', webSocketDebuggerUrl: 'ws://x/sw'}

  test('finds the blank page among the other targets', () => {
    expect(blankPageEndpoint([studio, worker, blank])).toBe(
      'ws://127.0.0.1:9222/devtools/page/BLANK',
    )
  })

  test('is null without a blank page target or for a malformed answer', () => {
    expect(blankPageEndpoint([studio, worker])).toBeNull()
    expect(blankPageEndpoint([{...blank, webSocketDebuggerUrl: 42}])).toBeNull()
    expect(blankPageEndpoint([])).toBeNull()
    expect(blankPageEndpoint({})).toBeNull()
    expect(blankPageEndpoint(null)).toBeNull()
  })
})

describe('getBrowserName', () => {
  test('reads the Browser field and falls back to Chrome', () => {
    expect(getBrowserName(versionInfo(ANNOUNCED))).toBe('Chrome/148.0.7778.96')
    expect(getBrowserName({})).toBe('Chrome')
    expect(getBrowserName(null)).toBe('Chrome')
  })
})
