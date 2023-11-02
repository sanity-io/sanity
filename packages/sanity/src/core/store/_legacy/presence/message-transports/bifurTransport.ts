import {Observable, EMPTY} from 'rxjs'
import {map, share} from 'rxjs/operators'
import {BifurClient} from '@sanity/bifur-client'
import {PresenceLocation} from '../types'
import {Transport, TransportEvent, TransportMessage} from './transport'

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

export const createBifurTransport = (bifur: BifurClient, sessionId: string): Transport => {
  const incomingEvents$: Observable<TransportEvent> = bifur
    .request<IncomingBifurEvent<Location[]>>('presence')
    .pipe(map(handleIncomingMessage))

  const dispatchMessage = (message: TransportMessage): Observable<undefined> => {
    if (message.type === 'rollCall') {
      return bifur.request('presence_rollcall', {session: sessionId})
    }

    if (message.type === 'state') {
      // return bifur.request('presence_announce', {
      //   data: {locations: message.locations, sessionId},
      // })
    }

    if (message.type === 'disconnect') {
      // return bifur.request('presence_disconnect', {session: sessionId})
    }

    return EMPTY
  }

  return [incomingEvents$.pipe(share()), dispatchMessage]
}
