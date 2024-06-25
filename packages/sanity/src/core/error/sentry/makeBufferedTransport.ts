import {makeFetchTransport} from '@sentry/react'
import {type EventEnvelope, type Transport, type TransportMakeRequestResponse} from '@sentry/types'

/**
 * @internal
 */
export type BufferedTransport = Transport & {
  setConsent: (consentGiven: boolean) => Promise<void>
}

/**
 * Because we want to buffer events until the user has given consent to telemetry,
 * we need to implement a custom transport, but mostly wrap the fetch transport.
 * @internal
 */
export function makeBufferedTransport(options: any): BufferedTransport {
  let buffer: EventEnvelope[] = []
  let consentGiven: boolean | undefined
  const fetchTransport = makeFetchTransport(options)

  const send = async (event: EventEnvelope) => {
    if (consentGiven) {
      return sendImmediately(event)
    }

    //we may not have received consent yet. Buffer the event until we know what to do.
    if (typeof consentGiven === 'undefined') {
      buffer.push(event)
    }
    // consent not given, skip sending the event
    return {}
  }

  const sendImmediately = async (event: EventEnvelope): Promise<TransportMakeRequestResponse> => {
    return fetchTransport.send(event)
  }

  const setConsent = async (consent: boolean) => {
    consentGiven = consent
    //we clear the buffer if consent is given (since we've sent the buffered events)
    //and we clear the buffer if consent is revoked (since the events should not be sent)
    if (consent) {
      await flushBuffer()
    }
    buffer = []
  }

  const flushBuffer = async () => {
    await Promise.all(buffer.map(sendImmediately)).catch((err) => {
      console.error('Failed to send buffered events from transport: ', err)
    })
  }

  const flush = async () => {
    return fetchTransport.flush()
  }

  return {
    flush,
    send,
    setConsent,
  }
}
