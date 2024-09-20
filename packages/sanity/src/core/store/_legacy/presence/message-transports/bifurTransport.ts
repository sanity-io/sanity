import {type BifurClient} from '@sanity/bifur-client'
import {EMPTY, type Observable} from 'rxjs'
import {map, share} from 'rxjs/operators'

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

type ExpireEvent = {
  type: 'expires'
  event: 'expires'
  at: string
}

type IncomingBifurEvent<T> =
  | RollCallEvent
  | BifurStateMessage
  | BifurDisconnectMessage
  | ExpireEvent

const handleIncomingMessage = (event: IncomingBifurEvent<Location[]>): TransportEvent => {
  // console.log('ws incoming  event', event)
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

  if (event.event === 'expires') {
    return {
      type: 'authorizationExpire',
      expiresAt: event.at,
      timestamp: new Date().toISOString(),
    }
  }

  throw new Error(`Got unknown presence event: ${JSON.stringify(event)}`)
}

export const createBifurTransport = (bifur: BifurClient, sessionId: string): Transport => {
  const incomingPresenceEvents$: Observable<TransportEvent> = bifur
    .listen<IncomingBifurEvent<Location[]>>('presence')
    .pipe(map(handleIncomingMessage))

  const incomingAuthorizationEvents$: Observable<TransportEvent> = bifur
    .listen<IncomingBifurEvent<Location[]>>('authorization')
    .pipe(map(handleIncomingMessage))

  // const testIncomingAuthorizationEvents$: Observable<TransportEvent> = bifur
  //   .listen<IncomingBifurEvent<Location[]>>('authorization')
  //   .pipe(map(handleIncomingMessage))
  //   .subscribe((event) => {
  //     // eslint-disable-next-line no-console
  //     console.log('[++++++]Authorization event', event)
  //   })

  const dispatchMessage = (message: TransportMessage): Observable<undefined> => {
    if (message.type === 'rollCall') {
      return bifur.request('presence_rollcall', {session: sessionId})
    }

    if (message.type === 'state') {
      return bifur.request('presence_announce', {
        data: {locations: message.locations, sessionId},
      })
    }

    if (message.type === 'disconnect') {
      return bifur.request('presence_disconnect', {session: sessionId})
    }

    return EMPTY
  }

  return [
    incomingPresenceEvents$.pipe(share()),
    incomingAuthorizationEvents$.pipe(share()),
    dispatchMessage,
  ]
}
