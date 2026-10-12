import {type BifurClient, RpcError} from '@sanity/bifur-client'
import {EMPTY, type Observable, throwError} from 'rxjs'
import {catchError, map, share} from 'rxjs/operators'

import {type PresenceLocation} from '../types'
import {type Transport, type TransportEvent, type TransportMessage} from './transport'

type BifurStateMessage = {
  type: 'state'
  i: string
  m: {
    sessionId: string
    locations: PresenceLocation[]
  }
}

type BifurDisconnectMessage = {
  type: 'disconnect'
  i: string
  m: {session: string}
}

type RollCallEvent = {
  type: 'rollCall'
  i: string
  session: string
}

type IncomingBifurEvent<T> = RollCallEvent | BifurStateMessage | BifurDisconnectMessage

const handleIncomingMessage = (event: IncomingBifurEvent<Location[]>): TransportEvent => {
  if (event.type === 'rollCall') {
    return {
      type: 'rollCall',
      userId: event.i,
      sessionId: event.session,
    }
  }
  if (event.type === 'state') {
    const {sessionId, locations} = event.m
    return {
      type: 'state',
      userId: event.i,
      sessionId: sessionId,
      timestamp: new Date().toISOString(),
      locations,
    }
  }

  if (event.type === 'disconnect') {
    return {
      type: 'disconnect',
      userId: event.i,
      sessionId: event.m.session,
      timestamp: new Date().toISOString(),
    }
  }

  throw new Error(`Got unknown presence event: ${JSON.stringify(event)}`)
}

/**
 * Presence is best effort: a request or subscription the server answers with an error (an
 * `RpcError`, e.g. when it refuses the credential) is dropped rather than taking presence, and
 * the studio, down. Connection failures still error, so presence restarts with the connection.
 */
function ignoreRejection<T>(source: Observable<T>): Observable<T> {
  return source.pipe(
    catchError((err: unknown) => {
      if (!(err instanceof RpcError)) return throwError(() => err)
      console.warn('Presence request rejected by the server: %s', err.message)
      return EMPTY
    }),
  )
}

export const createBifurTransport = (bifur: BifurClient, sessionId: string): Transport => {
  const incomingEvents$: Observable<TransportEvent> = bifur
    .listen<IncomingBifurEvent<Location[]>>('presence')
    .pipe(ignoreRejection, map(handleIncomingMessage))

  const dispatchMessage = (message: TransportMessage): Observable<undefined> => {
    if (message.type === 'rollCall') {
      return bifur
        .request<undefined>('presence_rollcall', {session: sessionId})
        .pipe(ignoreRejection)
    }

    if (message.type === 'state') {
      return bifur
        .request<undefined>('presence_announce', {
          data: {locations: message.locations, sessionId},
        })
        .pipe(ignoreRejection)
    }

    return EMPTY
  }

  return [incomingEvents$.pipe(share()), dispatchMessage]
}
