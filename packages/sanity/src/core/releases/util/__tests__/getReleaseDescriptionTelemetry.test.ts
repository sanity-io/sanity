import {describe, expect, it} from 'vitest'

import {getReleaseDescriptionTelemetry} from '../getReleaseDescriptionTelemetry'

describe('getReleaseDescriptionTelemetry', () => {
  it('reports an absent description as an empty count', () => {
    expect(getReleaseDescriptionTelemetry('create')).toEqual({
      action: 'create',
      characterCount: 0,
      containsUrl: false,
    })
  })

  it('passes the action through', () => {
    expect(getReleaseDescriptionTelemetry('create', 'hello').action).toBe('create')
    expect(getReleaseDescriptionTelemetry('edit', 'hello').action).toBe('edit')
  })

  it('counts characters without leaking the content', () => {
    expect(getReleaseDescriptionTelemetry('edit', '').characterCount).toBe(0)
    expect(getReleaseDescriptionTelemetry('edit', 'hello').characterCount).toBe(5)
    expect(getReleaseDescriptionTelemetry('edit', 'a'.repeat(500)).characterCount).toBe(500)
  })

  it('detects URLs in the description', () => {
    expect(getReleaseDescriptionTelemetry('edit', 'see https://example.com').containsUrl).toBe(true)
    expect(getReleaseDescriptionTelemetry('edit', 'see www.example.com').containsUrl).toBe(true)
    expect(getReleaseDescriptionTelemetry('edit', 'no links here').containsUrl).toBe(false)
  })
})
