/* eslint-disable @typescript-eslint/no-use-before-define */
import client from 'part:@sanity/base/client'
import {Observable} from 'rxjs'
import {doBeforeUnload} from '../utils/cleanupBeforeUnload'
import {listen, ReflectorMessageEvent, ReflectorWelcomeEvent} from './reflectorListener'
import {map} from 'rxjs/operators'

interface WelcomeEvent {
  type: 'welcome'
  channel: string
  project: string
  identity: string
}

export interface PresenceSyncEvent<State> {
  type: 'sync'
  state: State
}

interface PresenceDisconnectEvent {
  type: 'disconnect'
}

interface PresenceRollCallEvent {
  type: 'rollCall'
}

type PresenceEvent<T> = PresenceSyncEvent<T> | PresenceDisconnectEvent | PresenceRollCallEvent

type ReceivedEvent<T> = T & {
  clientId: string
  identity: string
  timestamp: string
}

const isWelcomeEvent = (event: {type: string}): event is ReflectorWelcomeEvent => {
  return event.type === 'welcome'
}

const toPresenceEvent = <State>(
  event: ReflectorWelcomeEvent | ReflectorMessageEvent<ReceivedEvent<PresenceEvent<State>>>
): WelcomeEvent | ReceivedEvent<PresenceEvent<State>> => {
  if (isWelcomeEvent(event)) {
    return {
      type: 'welcome',
      channel: event.data.channel,
      project: event.data.project,
      identity: event.data.identity
    }
  }
  return messageToPresenceEvent(event)
}

const isSyncEvent = <State>(
  event: ReceivedEvent<PresenceEvent<any>>
): event is ReceivedEvent<PresenceSyncEvent<State>> => {
  return event.type === 'sync'
}

const messageToPresenceEvent = <State>(
  event: ReflectorMessageEvent<ReceivedEvent<PresenceEvent<any>>>
): ReceivedEvent<PresenceEvent<State>> => {
  const {m: message, i: identity} = event.data
  if (isSyncEvent(message)) {
    return {
      type: 'sync',
      identity,
      clientId: message.clientId,
      timestamp: new Date().toISOString(),
      state: message.state
    }
  } else if (message.type === 'disconnect') {
    return {
      type: 'disconnect',
      identity,
      clientId: message.clientId,
      timestamp: new Date().toISOString()
    }
  } else if (message.type === 'rollCall') {
    return {
      type: 'rollCall',
      identity,
      clientId: message.clientId,
      timestamp: new Date().toISOString()
    }
  }
  throw new Error(`Got unknown presence event: ${JSON.stringify(event.data.m)}`)
}

export const createReflectorTransport = <State>(
  channel: string,
  clientId: string
): [
  Observable<WelcomeEvent | ReceivedEvent<PresenceEvent<State>>>,
  (messages: PresenceEvent<State>[]) => Promise<void>
] => {
  const messages$ = listen<ReceivedEvent<PresenceEvent<State>>>(channel).pipe(
    map(toPresenceEvent),
    doBeforeUnload(() => sendBeacon(channel, {type: 'disconnect', clientId}))
  )

  const sendMessages = messages =>
    messages.forEach(message => send(channel, {...message, clientId}))

  return [messages$, sendMessages]
}

function send(channel, message) {
  return client.request({
    url: `presence/send/${channel}`,
    method: 'POST',
    body: message
  })
}

// Sends a message using the beacon api which in some browsers lets us send a little bit of
// data while the window is closing. Returns true if the message was successfully submitted,
// false if it failed or if status is unknown.
function sendBeacon(channel, message) {
  if (typeof navigator == 'undefined' || typeof navigator.sendBeacon != 'function') {
    // If sendBeacon is not supported, just try to send it the old fashioned way
    send(channel, message)
    return false
  }
  const url = client.getUrl(`presence/send/${channel}`)
  return navigator.sendBeacon(url, JSON.stringify(message))
}
