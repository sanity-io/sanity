import {
  ChannelError,
  ClientError,
  ConnectionFailedError,
  DisconnectError,
  MessageError,
  MessageParseError,
} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {isListenerConnectionError, isTransientListenerError} from '../listenerErrors'

describe('isTransientListenerError', () => {
  describe('channel errors', () => {
    it('is transient for an error the API could not classify', () => {
      const error = new ChannelError('Internal error', {error: {description: 'Internal error'}})
      expect(isTransientListenerError(error)).toBe(true)
    })

    it.each(['internalError', 'timeoutError', 'unavailableError'])(
      'is transient for a typed %s',
      (type) => {
        const error = new ChannelError('Failed', {error: {type, description: 'Failed'}})
        expect(isTransientListenerError(error)).toBe(true)
      },
    )

    it('is transient for a mutation the API failed to encode', () => {
      // The API sends `{message}` with the error it got encoding the mutation. Its text varies, and
      // only the shape of the payload matters here.
      const message = 'encoding the mutation failed'
      const error = new ChannelError(message, {message})
      expect(isTransientListenerError(error)).toBe(true)
    })

    it.each([
      'queryParseError',
      'queryError',
      'permissionDeniedError',
      'namespaceNotFoundError',
      'httpBadRequest',
    ])('is not transient for a typed %s', (type) => {
      const error = new ChannelError('Failed', {error: {type, description: 'Failed'}})
      expect(isTransientListenerError(error)).toBe(false)
    })

    it('matches a channel error from another client copy by name', () => {
      const error = Object.assign(new Error('Internal error'), {
        name: 'ChannelError',
        data: {error: {description: 'Internal error'}},
      })
      expect(isTransientListenerError(error)).toBe(true)
    })
  })

  it.each([
    ['a message error', new MessageError('Unexpected error', {})],
    ['a message parse error', new MessageParseError('Unable to parse EventSource message')],
  ])('is transient for %s', (_, error) => {
    expect(isTransientListenerError(error)).toBe(true)
  })

  it('is not transient for a disconnect', () => {
    expect(isTransientListenerError(new DisconnectError('Server disconnected client'))).toBe(false)
  })

  describe('rejected listen requests', () => {
    it('is transient without a status', () => {
      const error = new ConnectionFailedError('EventSource connection failed')
      expect(isTransientListenerError(error)).toBe(true)
    })

    it.each([408, 429, 500, 502, 503])('is transient for a %d', (status) => {
      const error = new ConnectionFailedError('EventSource connection failed', {status})
      expect(isTransientListenerError(error)).toBe(true)
    })

    it.each([400, 401, 403, 404])('is not transient for a %d', (status) => {
      const error = new ConnectionFailedError('EventSource connection failed', {status})
      expect(isTransientListenerError(error)).toBe(false)
    })
  })

  it.each([
    ['a plain error', new Error('Something broke')],
    [
      'a client error',
      new ClientError({
        statusCode: 500,
        headers: {},
        body: {},
        url: 'https://example.api.sanity.io',
        method: 'GET',
      }),
    ],
    ['a non-error value', 'Internal error'],
  ])('is not transient for %s', (_, error) => {
    expect(isTransientListenerError(error)).toBe(false)
  })
})

describe('isListenerConnectionError', () => {
  function channelError(type: string) {
    return new ChannelError('Failed', {error: {type, description: 'Failed'}})
  }

  it.each([
    ['a channel error the API could not classify', channelError('internalError')],
    ['a dataset the listener cannot read', channelError('permissionDeniedError')],
    ['a deleted dataset', channelError('namespaceNotFoundError')],
    ['a listener limit', channelError('resourceError')],
    [
      'an untyped channel error',
      new ChannelError('Internal error', {error: {description: 'Internal error'}}),
    ],
    ['a disconnect', new DisconnectError('Server disconnected client')],
    ['a listen request rejected with a 403', new ConnectionFailedError('Rejected', {status: 403})],
    ['a listen request rejected with a 503', new ConnectionFailedError('Rejected', {status: 503})],
    ['a message error', new MessageError('Unexpected error', {})],
  ])('is a connection error for %s', (_, error) => {
    expect(isListenerConnectionError(error)).toBe(true)
  })

  it.each([
    ['an error in the query', channelError('queryParseError')],
    ['an error evaluating the query', channelError('queryError')],
    ['a rejected session', new ConnectionFailedError('Rejected', {status: 401})],
    ['a plain error', new Error('Something broke')],
    [
      'a client error',
      new ClientError({
        statusCode: 500,
        headers: {},
        body: {},
        url: 'https://example.api.sanity.io',
        method: 'GET',
      }),
    ],
    ['a non-error value', {name: 'ChannelError', message: 'Internal error'}],
  ])('is not a connection error for %s', (_, error) => {
    expect(isListenerConnectionError(error)).toBe(false)
  })

  it('matches a listener error from another client copy by name', () => {
    const error = Object.assign(new Error('Server disconnected client'), {name: 'DisconnectError'})
    expect(isListenerConnectionError(error)).toBe(true)
  })
})
