import {describe, expect, it} from 'vitest'

import {formatBytes, getPayloadBytes} from './payloadSize'

describe('getPayloadBytes', () => {
  it('measures ordinary JSON values', () => {
    expect(getPayloadBytes({a: 1})).toBe(new TextEncoder().encode('{"a":1}').byteLength)
    expect(getPayloadBytes(undefined)).toBe(0)
  })

  it('returns 0 for BigInt and a positive size for depth-truncated circular values', () => {
    expect(getPayloadBytes(10n)).toBe(0)
    const circular: {self?: unknown} = {}
    circular.self = circular
    expect(getPayloadBytes(circular)).toBeGreaterThan(0)
  })
})

describe('formatBytes', () => {
  it('formats byte sizes', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(999)).toBe('999 B')
    expect(formatBytes(1000)).toBe('1.00 kB')
  })
})
