/* eslint-disable @typescript-eslint/no-use-before-define */
import {map, mergeMapTo, share, switchMapTo, tap} from 'rxjs/operators'
import {Transport, TransportEvent, TransportMessage} from './transport'
import {PresenceLocation} from '../types'
import {EMPTY, fromEvent, merge, Observable} from 'rxjs'

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
}

type IncomingBifurEvent<T> = RollCallEvent | BifurStateMessage | BifurDisconnectMessage

const handleIncomingMessage = (event: IncomingBifurEvent<Location[]>): TransportEvent => {
  if (event.type === 'rollCall') {
    return {
      type: 'rollCall'
    }
  }
  if (event.type === 'state') {
    const {sessionId, locations} = event.m
    return {
      type: 'state',
      userId: event.i,
      sessionId: sessionId,
      timestamp: new Date().toISOString(),
      locations
    }
  }

  if (event.type === 'disconnect') {
    return {
      type: 'disconnect',
      userId: event.i,
      sessionId: event.m.session,
      timestamp: new Date().toISOString()
    }
  }

  throw new Error(`Got unknown presence event: ${JSON.stringify(event)}`)
}

export const createBifurTransport = (bifur, sessionId: string): Transport => {
  const disconnect$: Observable<never> = fromEvent(window, 'beforeunload').pipe(
    tap(() => console.log('before unload')),
    switchMapTo(bifur.request('presence_disconnect', {session: sessionId})),
    mergeMapTo(EMPTY)
  )
  const incomingEvents$: Observable<TransportEvent> = merge(
    bifur.request('presence').pipe(map(handleIncomingMessage)),
    disconnect$
  )

  const dispatchMessage = (message: TransportMessage) => {
    if (message.type === 'rollCall') {
      return bifur.request('presence_rollcall')
    }
    if (message.type === 'state') {
      return bifur.request('presence_announce', {
        data: {locations: message.locations, sessionId}
      })
    }
  }

  return [incomingEvents$.pipe(share()), dispatchMessage]
}
