import {describe, expect, it} from 'vitest'

import {
  DocumentPublished,
  PublishButtonReady,
  PublishButtonStateChanged,
  PublishOutcomeTracked,
} from './documentActions.telemetry'

describe('documentActions telemetry events', () => {
  it('DocumentPublished is a well-formed telemetry event', () => {
    expect(DocumentPublished.type).toBe('log')
    expect(DocumentPublished.name).toBe('Document Published')
    expect(DocumentPublished.version).toBe(1)
  })

  it('PublishButtonStateChanged is a well-formed telemetry event', () => {
    expect(PublishButtonStateChanged.type).toBe('log')
    expect(PublishButtonStateChanged.name).toBe('Publish Button State Changed')
    expect(PublishButtonStateChanged.version).toBe(1)
    expect(PublishButtonStateChanged.maxSampleRate).toBe(500)
  })

  it('PublishOutcomeTracked is a well-formed telemetry event', () => {
    expect(PublishOutcomeTracked.type).toBe('log')
    expect(PublishOutcomeTracked.name).toBe('Publish Outcome Tracked')
    expect(PublishOutcomeTracked.version).toBe(1)
  })

  it('PublishButtonReady is a well-formed telemetry event', () => {
    expect(PublishButtonReady.type).toBe('log')
    expect(PublishButtonReady.name).toBe('Publish Button Ready')
    expect(PublishButtonReady.version).toBe(1)
  })
})
