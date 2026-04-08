import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type FeedbackPayload} from '../types'

const mockCaptureEvent = vi.fn().mockReturnValue('mock-event-id')
const mockFlush = vi.fn().mockResolvedValue(true)

vi.mock('@sentry/react', () => {
  const mockClient = {init: vi.fn(), flush: mockFlush}
  return {
    BrowserClient: class MockBrowserClient {
      init = vi.fn()
    },
    Scope: class MockScope {
      setClient = vi.fn()
      captureEvent = mockCaptureEvent
      getClient = vi.fn().mockReturnValue(mockClient)
    },
    defaultStackParser: {},
    makeFetchTransport: vi.fn(),
  }
})

vi.mock('../../environment', () => ({isDev: false}))
vi.mock('../../version', () => ({SANITY_VERSION: '3.0.0-test'}))

describe('sendFeedbackToSentry', () => {
  let sendFeedbackToSentry: (payload: FeedbackPayload) => Promise<string>

  beforeEach(async () => {
    vi.resetModules()
    mockCaptureEvent.mockClear()
    mockFlush.mockClear()
    const mod = await import('../feedbackClient')
    sendFeedbackToSentry = mod.sendFeedbackToSentry
  })

  function makePayload(overrides: Partial<FeedbackPayload> = {}): FeedbackPayload {
    return {
      dsn: 'https://key@sentry.sanity.io/123',
      feedbackVersion: '1',
      telemetryConsent: 'granted',
      name: 'Test User',
      email: 'test@example.com',
      message: 'Great feature!',
      source: 'studio-help-menu',
      tags: {
        userId: 'user-123',
        studioVersion: '3.0.0',
        url: 'http://localhost:3333',
      },
      ...overrides,
    }
  }

  it('returns an event ID', async () => {
    const result = await sendFeedbackToSentry(makePayload())
    expect(result).toBe('mock-event-id')
  })

  it('sends feedback event with correct structure', async () => {
    await sendFeedbackToSentry(makePayload())

    const [event] = mockCaptureEvent.mock.calls[0]
    expect(event.type).toBe('feedback')
    expect(event.level).toBe('info')
    expect(event.contexts.feedback.message).toBe('Great feature!')
    expect(event.contexts.feedback.source).toBe('studio-help-menu')
  })

  describe('when telemetry consent is granted', () => {
    it('includes PII in contexts', async () => {
      await sendFeedbackToSentry(makePayload({telemetryConsent: 'granted'}))

      const [event] = mockCaptureEvent.mock.calls[0]
      expect(event.contexts.feedback.contactEmail).toBe('test@example.com')
      expect(event.contexts.feedback.name).toBe('Test User')
    })

    it('includes contactEmail, contactName, and userId in tags', async () => {
      await sendFeedbackToSentry(makePayload({telemetryConsent: 'granted'}))

      const [event] = mockCaptureEvent.mock.calls[0]
      expect(event.tags.contactEmail).toBe('test@example.com')
      expect(event.tags.contactName).toBe('Test User')
      expect(event.tags.userId).toBe('user-123')
    })
  })

  describe('when telemetry consent is denied', () => {
    it('strips PII from contexts', async () => {
      await sendFeedbackToSentry(makePayload({telemetryConsent: 'denied'}))

      const [event] = mockCaptureEvent.mock.calls[0]
      expect(event.contexts.feedback.contactEmail).toBeUndefined()
      expect(event.contexts.feedback.name).toBeUndefined()
    })

    it('omits contactEmail and contactName from tags', async () => {
      await sendFeedbackToSentry(makePayload({telemetryConsent: 'denied'}))

      const [event] = mockCaptureEvent.mock.calls[0]
      expect(event.tags).not.toHaveProperty('contactEmail')
      expect(event.tags).not.toHaveProperty('contactName')
    })

    it('strips userId from tags', async () => {
      await sendFeedbackToSentry(makePayload({telemetryConsent: 'denied'}))

      const [event] = mockCaptureEvent.mock.calls[0]
      expect(event.tags).not.toHaveProperty('userId')
    })
  })

  describe('when telemetry consent is loading', () => {
    it('treats loading as denied (strips PII)', async () => {
      await sendFeedbackToSentry(makePayload({telemetryConsent: 'loading'}))

      const [event] = mockCaptureEvent.mock.calls[0]
      expect(event.contexts.feedback.contactEmail).toBeUndefined()
      expect(event.contexts.feedback.name).toBeUndefined()
      expect(event.tags).not.toHaveProperty('contactEmail')
      expect(event.tags).not.toHaveProperty('contactName')
      expect(event.tags).not.toHaveProperty('userId')
    })
  })

  describe('when telemetry is denied but contact consent is given', () => {
    it('includes name and email in contexts', async () => {
      await sendFeedbackToSentry(
        makePayload({
          telemetryConsent: 'denied',
          tags: {
            userId: 'user-123',
            studioVersion: '3.0.0',
            url: 'http://localhost:3333',
            contactConsent: 'true',
          },
        }),
      )

      const [event] = mockCaptureEvent.mock.calls[0]
      expect(event.contexts.feedback.contactEmail).toBe('test@example.com')
      expect(event.contexts.feedback.name).toBe('Test User')
    })

    it('includes contactEmail and contactName in tags', async () => {
      await sendFeedbackToSentry(
        makePayload({
          telemetryConsent: 'denied',
          tags: {
            userId: 'user-123',
            studioVersion: '3.0.0',
            url: 'http://localhost:3333',
            contactConsent: 'true',
          },
        }),
      )

      const [event] = mockCaptureEvent.mock.calls[0]
      expect(event.tags.contactEmail).toBe('test@example.com')
      expect(event.tags.contactName).toBe('Test User')
    })

    it('still strips userId from tags', async () => {
      await sendFeedbackToSentry(
        makePayload({
          telemetryConsent: 'denied',
          tags: {
            userId: 'user-123',
            studioVersion: '3.0.0',
            url: 'http://localhost:3333',
            contactConsent: 'true',
          },
        }),
      )

      const [event] = mockCaptureEvent.mock.calls[0]
      expect(event.tags).not.toHaveProperty('userId')
    })
  })

  it('includes feedbackVersion, telemetryConsent, type, and source in tags', async () => {
    await sendFeedbackToSentry(makePayload())

    const [event] = mockCaptureEvent.mock.calls[0]
    expect(event.tags.feedbackVersion).toBe('1')
    expect(event.tags.telemetryConsent).toBe('granted')
    expect(event.tags.type).toBe('feedback')
    expect(event.tags.source).toBe('studio-help-menu')
  })

  it('spreads custom tags from payload', async () => {
    await sendFeedbackToSentry(
      makePayload({
        tags: {
          userId: 'user-123',
          studioVersion: '3.0.0',
          url: 'http://localhost:3333',
          customTag: 'custom-value',
        },
      }),
    )

    const [event] = mockCaptureEvent.mock.calls[0]
    expect(event.tags.customTag).toBe('custom-value')
    expect(event.tags.studioVersion).toBe('3.0.0')
  })

  it('passes attachments in the hint when provided', async () => {
    const attachment = {filename: 'screenshot.png', data: new Uint8Array([1, 2, 3])}
    await sendFeedbackToSentry(makePayload({attachments: [attachment]}))

    const [, hint] = mockCaptureEvent.mock.calls[0]
    expect(hint.attachments).toEqual([attachment])
  })

  it('passes empty hint when no attachments', async () => {
    await sendFeedbackToSentry(makePayload({attachments: undefined}))

    const [, hint] = mockCaptureEvent.mock.calls[0]
    expect(hint).toEqual({})
  })

  it('handles missing name and email gracefully with consent', async () => {
    await sendFeedbackToSentry(makePayload({name: undefined, email: undefined}))

    const [event] = mockCaptureEvent.mock.calls[0]
    expect(event.tags.contactEmail).toBe('')
    expect(event.tags.contactName).toBe('')
  })

  it('forwards url from tags to feedback context', async () => {
    await sendFeedbackToSentry(makePayload())

    const [event] = mockCaptureEvent.mock.calls[0]
    expect(event.contexts.feedback.url).toBe('http://localhost:3333')
  })
})
