import {type Any, type ReconnectEvent} from '@sanity/client'
import {defer, isObservable, mergeMap, Observable, of} from 'rxjs'

export type OpenEvent = {type: 'open'}

export class ConnectionFailedError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'ConnectionFailedError'
  }

  readonly name = 'ConnectionFailedError'
}

export class DisconnectEventError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DisconnectEventError'
  }

  readonly name = 'DisconnectEventError'
}

export class ChannelError extends Error {
  readonly name = 'ChannelError'
  readonly data?: unknown
  constructor(message: string, data: unknown) {
    super(message)
    this.data = data
  }
}

export class MessageError extends Error {
  readonly name = 'MessageError'
  readonly data?: unknown
  constructor(message: string, data: unknown, options: ErrorOptions = {}) {
    super(message, options)
    this.data = data
  }
}

export class MessageParseError extends Error {
  constructor(message: string, options: ErrorOptions) {
    super(message, options)
    this.name = 'MessageParseError'
  }

  readonly name = 'MessageParseError'
}

export const RECONNECT_EVENT: ReconnectEvent = {type: 'reconnect'}
export const OPEN_EVENT: OpenEvent = {type: 'open'}

export interface ServerSentEvent {
  type: string
  id: string
  data?: unknown
}

export type EventSourceEvent = OpenEvent | ReconnectEvent | ServerSentEvent

export type EventSourceInstance = InstanceType<typeof globalThis.EventSource>

/**
 * Low-level Sanity API specific eventsource handler shared between the listen and live APIs
 * This opens up a connection to a server sent events endpoint on the Sanity API
 * Since the EventSource API is not available in all environments, allows for custom initialization of the EventSource instance by taking a function that initializes the EventSource instance.
 * @param initEventSource - A function that, when called, returns an EventSource instance or an Observable that resolves to an EventSource instance
 * @param events - an array of named events from the API to listen for.
 */
export function connectEventSource(
  initEventSource: () => EventSourceInstance | Observable<EventSourceInstance>,
  events: string[],
): Observable<EventSourceEvent> {
  return defer(() => {
    const es = initEventSource()
    return isObservable(es) ? es : of(es)
  }).pipe(mergeMap((es) => connectWithESInstance(es, events)))
}

// Always listen for these events, no matter what
const REQUIRED_EVENTS = ['channelError', 'disconnect']

function connectWithESInstance(es: EventSourceInstance, events: string[]) {
  return new Observable<EventSourceEvent>((observer) => {
    const emitOpen = events.includes('open')
    const emitReconnect = events.includes('reconnect')

    // EventSource will emit a regular Event if it fails to connect, however the API may also emit an `error` MessageEvent
    // So we need to handle both cases
    function onError(evt: MessageEvent | Event) {
      // If the event has a `data` property, then it`s a MessageEvent emitted by the API and we should forward the error
      if ('data' in evt) {
        const [parseError, event] = parseEvent(evt)
        observer.error(
          parseError
            ? new MessageParseError('Unable to parse EventSource error message', {cause: event})
            : new MessageError((event?.data as Any).message, event),
        )
        return
      }

      // We should never be in a disconnected state. By default, EventSource will reconnect
      // automatically, but in some cases (like when a laptop lid is closed), it will trigger onError
      // if it can't reconnect.
      // see https://html.spec.whatwg.org/multipage/server-sent-events.html#sse-processing-model
      if (es.readyState === es.CLOSED) {
        // In these cases we'll signal to consumers (via the error path) that a retry/reconnect is needed.
        observer.error(new ConnectionFailedError('EventSource connection failed'))
      } else if (emitReconnect) {
        observer.next({type: 'reconnect'})
      }
    }

    function onOpen() {
      // The open event of the EventSource API is fired when a connection with an event source is opened.
      observer.next(OPEN_EVENT)
    }

    function onMessage(message: MessageEvent) {
      const [parseError, event] = parseEvent(message)
      if (parseError) {
        observer.error(
          new MessageParseError('Unable to parse EventSource message', {
            cause: parseError,
          }),
        )
        return
      }
      if (message.type === 'channelError') {
        // An error occurred. This is different from a network-level error (which will be emitted as 'error').
        // Possible causes are things such as malformed filters, non-existant datasets or similar.
        observer.error(new ChannelError(extractErrorMessage(event?.data), event.data))
        return
      }
      if (message.type === 'disconnect') {
        // The listener has been told to explicitly disconnect and not reconnect.
        // This is a rare situation, but may occur if the API knows reconnect attempts will fail,
        // eg in the case of a deleted dataset, a blocked project or similar events.
        observer.error(
          new DisconnectEventError(`Server disconnected client: ${(event.data as Any)?.reason}`),
        )
        return
      }
      observer.next({
        type: message.type,
        id: message.lastEventId,
        ...(event.data ? {data: event.data} : {}),
      })
    }

    es.addEventListener('error', onError)

    if (emitOpen) {
      es.addEventListener('open', onOpen)
    }

    // Make sure we have a unique list of event names to avoid listening multiple times,
    const uniqueEventNames = [...new Set([...REQUIRED_EVENTS, ...events])]
      // filter out events that are handled separately
      .filter((type) => type !== 'error' && type !== 'open' && type !== 'reconnect')

    uniqueEventNames.forEach((type: string) => es.addEventListener(type, onMessage))

    return () => {
      es.removeEventListener('error', onError)
      if (emitOpen) {
        es.removeEventListener('open', onOpen)
      }
      uniqueEventNames.forEach((type: string) => es.removeEventListener(type, onMessage))
      es.close()
    }
  })
}

function parseEvent(
  message: MessageEvent,
): [null, {type: string; id: string; data?: unknown}] | [Error, null] {
  try {
    const data = typeof message.data === 'string' && JSON.parse(message.data)
    return [
      null,
      {
        type: message.type,
        id: message.lastEventId,
        ...(data ? {data} : {}),
      },
    ]
  } catch (err) {
    return [err as Error, null]
  }
}

function extractErrorMessage(err: Any) {
  if (!err.error) {
    return err.message || 'Unknown listener error'
  }

  if (err.error.description) {
    return err.error.description
  }

  return typeof err.error === 'string' ? err.error : JSON.stringify(err.error, null, 2)
}
